import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  DollarSign,
  CreditCard,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  BadgePercent,
  XCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { usePriceCalculation } from "../hooks/usePriceCalculation";
import {
  isHeldStatus,
  getHoldExpiryDate,
  isHoldStillActive,
  normalizeCourtStatus,
} from "../utils/slotStatusUtils";
import {
  fetchFieldAvailability,
  fetchFieldById,
  fetchFieldQuantities,
  fetchAvailableQuantities,
  type FieldSlot,
  type Quantity,
} from "../models/fields.api";
import {
  confirmFieldBooking,
  type ConfirmBookingPayload,
  type ConfirmBookingResponse,
} from "../models/booking.api";
import type { FieldWithQuantity, ShopPromotion } from "../types";
import { getSportLabel, resolveFieldPrice } from "../utils/field-helpers";
import resolveImageUrl from "../utils/image-helpers";
import AvailableCourtSelector, {
  type CourtAvailabilityOption,
} from "../components/forms/AvailableCourtSelector";
import { fetchActiveShopPromotions } from "../models/promotions.api";

interface BookingFormData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  payment_method: "banktransfer";
  notes?: string;
}

type BookingStatePayload = {
  date: string;
  startTime: string;
  duration: number;
};

type BookingDetails = {
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalPrice: number;
  slotCount: number;
  isContiguous: boolean;
};

type CourtAvailabilityStatus = CourtAvailabilityOption["status"];

type TimeGroup = {
  key: string;
  baseSlot: FieldSlot;
  courts: FieldSlot[];
  play_date: string;
  start_time: string;
  end_time: string;
  isFullyBooked: boolean;
};

type BookingLocationState = {
  field?: FieldWithQuantity;
  bookingDetails?: BookingStatePayload;
};

const todayString = () => {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60 * 1000;
  const local = new Date(now.getTime() - offsetMs);
  return local.toISOString().split("T")[0];
};

const timeToMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const addMinutesToTime = (time: string, minutes: number) => {
  const total = timeToMinutes(time) + minutes;
  const hh = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const mm = (total % 60).toString().padStart(2, "0");
  return `${hh}:${mm}`;
};

const minutesToLabel = (minutes: number) => {
  if (minutes <= 0) return "0 phút";
  if (minutes % 60 === 0) {
    return `${minutes / 60} giờ`;
  }
  return `${minutes} phút`;
};

const normalizeCourtStatusValue = normalizeCourtStatus;

const formatHoldExpiresAt = (
  value: string | null,
  epochSeconds?: number | null
) => {
  if (typeof epochSeconds === "number" && !Number.isNaN(epochSeconds)) {
    const date = new Date(epochSeconds * 1000);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }
  if (!value) return "";
  const normalized = value.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return fallback;
};

const deriveSlotState = (slot: FieldSlot) => {
  const normalizedStatus = String(slot.status ?? "").toLowerCase();
  const availabilityState = String(
    slot.availability_state ?? slot.availability_status ?? ""
  ).toLowerCase();

  let isAvailable: boolean | undefined;
  const updateAvailability = (hint: boolean | undefined) => {
    if (typeof hint !== "boolean") return;
    if (hint === false) {
      isAvailable = false;
      return;
    }
    if (isAvailable !== false) {
      isAvailable = true;
    }
  };

  updateAvailability(slot.is_available);
  if (availabilityState === "available") {
    updateAvailability(true);
  } else if (
    availabilityState === "unavailable" ||
    availabilityState === "unavailable_slot"
  ) {
    updateAvailability(false);
  }

  if (normalizedStatus === "available") {
    updateAvailability(true);
  }
  if (
    [
      "booked",
      "blocked",
      "on_hold",
      "held",
      "hold",
      "confirmed",
      "reserved",
      "disabled",
    ].includes(normalizedStatus)
  ) {
    updateAvailability(false);
  }

  const isHeld = ["held", "on_hold", "holding", "hold"].includes(
    normalizedStatus
  );
  const isBooked = ["booked", "confirmed", "reserved"].includes(
    normalizedStatus
  );
  const isBlocked = ["blocked", "disabled"].includes(normalizedStatus);
  const computedIsAvailable =
    isAvailable !== false && !isHeld && !isBooked && !isBlocked;

  return {
    isAvailable: computedIsAvailable,
    isHeld,
    isBooked,
    isBlocked,
    normalizedStatus,
  };
};

const MIN_AVAILABILITY_REFRESH_DELAY_MS = 1000;
const MAX_AVAILABILITY_REFRESH_DELAY_MS = 60000;
const EXPIRY_MATCH_EPSILON_MS = 1000;
const MAX_TIMEOUT_MS = 2147483647;

const BookingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const locationState =
    typeof location.state === "object" && location.state !== null
      ? (location.state as BookingLocationState)
      : undefined;
  const fieldFromState = locationState?.field;
  const rawBookingPrefill = locationState?.bookingDetails;

  const bookingPrefill = useMemo(() => {
    if (!rawBookingPrefill) return null;
    const minutes = Math.round((rawBookingPrefill.duration ?? 0) * 60);
    const endTime = addMinutesToTime(rawBookingPrefill.startTime, minutes);
    return {
      ...rawBookingPrefill,
      endTime,
    };
  }, [rawBookingPrefill]);

  const initialDate = bookingPrefill?.date ?? todayString();

  const [field, setField] = useState<FieldWithQuantity | null>(
    fieldFromState ?? null
  );
  const [loadingField, setLoadingField] = useState(!fieldFromState && !!id);
  const [fieldError, setFieldError] = useState("");

  useEffect(() => {
    let ignore = false;
    if (!fieldFromState && id) {
      const numericId = Number(id);
      if (!Number.isFinite(numericId)) {
        setFieldError("Mã sân không hợp lệ.");
        setLoadingField(false);
        return;
      }
      (async () => {
        setLoadingField(true);
        setFieldError("");
        try {
          const fetched = await fetchFieldById(numericId);
          if (!ignore) setField(fetched ?? null);
        } catch (error: unknown) {
          if (!ignore) {
            const message = getErrorMessage(
              error,
              "Không thể tải thông tin sân. Vui lòng thử lại."
            );
            setFieldError(message);
            setField(null);
          }
        } finally {
          if (!ignore) setLoadingField(false);
        }
      })();
    }
    return () => {
      ignore = true;
    };
  }, [fieldFromState, id]);

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [slots, setSlots] = useState<FieldSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState("");
  const [selectedSlotIds, setSelectedSlotIds] = useState<number[]>([]);
  const [selectedQuantityID, setSelectedQuantityID] = useState<number>();
  const [availabilityRefreshKey, setAvailabilityRefreshKey] = useState(0);
  const [loadingQuantities, setLoadingQuantities] = useState(false);
  const [courtOptions, setCourtOptions] = useState<CourtAvailabilityOption[]>(
    []
  );
  const [fieldQuantities, setFieldQuantities] = useState<Quantity[]>([]);
  const availabilityRefreshTimerRef = useRef<number | null>(null);
  const availabilityRefreshTargetRef = useRef<number | null>(null);
  const availabilityRefreshBackoffRef = useRef<number>(
    MIN_AVAILABILITY_REFRESH_DELAY_MS
  );
  const availabilityLastObservedExpiryRef = useRef<number | null>(null);

  const [promotionCode, setPromotionCode] = useState("");
  const [promotionOptions, setPromotionOptions] = useState<ShopPromotion[]>([]);
  const [promotionLoading, setPromotionLoading] = useState(false);
  const [promotionError, setPromotionError] = useState("");

  useEffect(() => {
    if (!field?.field_code || !selectedDate) {
      setSlots([]);
      return;
    }
    let ignore = false;
    setLoadingSlots(true);
    setSlotsError("");
    setSlots([]);
    (async () => {
      try {
        const res = await fetchFieldAvailability(
          field.field_code,
          selectedDate
        );
        if (!ignore) {
          setSlots(res.slots ?? []);
          if (!res.slots?.length) {
            setSlotsError("Ngày này chưa mở lịch hoặc đã kín lịch.");
          }
        }
      } catch (error: unknown) {
        if (!ignore) {
          setSlots([]);
          const message = getErrorMessage(
            error,
            "Không thể tải khung giờ trống. Vui lòng thử lại."
          );
          setSlotsError(message);
        }
      } finally {
        if (!ignore) setLoadingSlots(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [field?.field_code, selectedDate, availabilityRefreshKey]);

  useEffect(() => {
    const clearPendingRefresh = () => {
      if (availabilityRefreshTimerRef.current !== null) {
        clearTimeout(availabilityRefreshTimerRef.current);
        availabilityRefreshTimerRef.current = null;
      }
      availabilityRefreshTargetRef.current = null;
    };

    if (!slots.length) {
      clearPendingRefresh();
      availabilityRefreshBackoffRef.current = MIN_AVAILABILITY_REFRESH_DELAY_MS;
      availabilityLastObservedExpiryRef.current = null;
      return;
    }

    const now = Date.now();
    const nextExpiryMs = slots
      .map((slot) =>
        getHoldExpiryDate(slot.hold_expires_at, slot.hold_expires_at_ts ?? null)
      )
      .filter((date): date is Date => Boolean(date))
      .map((date) => date.getTime())
      .filter((time) => time > now)
      .sort((a, b) => a - b)[0];

    if (!nextExpiryMs) {
      clearPendingRefresh();
      availabilityRefreshBackoffRef.current = MIN_AVAILABILITY_REFRESH_DELAY_MS;
      availabilityLastObservedExpiryRef.current = null;
      return;
    }

    const previousObservedExpiry = availabilityLastObservedExpiryRef.current;
    if (
      previousObservedExpiry !== null &&
      Math.abs(previousObservedExpiry - nextExpiryMs) <= EXPIRY_MATCH_EPSILON_MS
    ) {
      availabilityRefreshBackoffRef.current = Math.min(
        availabilityRefreshBackoffRef.current * 2,
        MAX_AVAILABILITY_REFRESH_DELAY_MS
      );
    } else {
      availabilityRefreshBackoffRef.current = MIN_AVAILABILITY_REFRESH_DELAY_MS;
    }
    availabilityLastObservedExpiryRef.current = nextExpiryMs;

    const baseDelay = Math.max(500, nextExpiryMs - now + 200);
    const delay = Math.min(
      Math.max(availabilityRefreshBackoffRef.current, baseDelay),
      MAX_TIMEOUT_MS
    );
    const scheduledTarget = now + delay;
    const existingTarget = availabilityRefreshTargetRef.current;

    if (
      availabilityRefreshTimerRef.current !== null &&
      existingTarget !== null &&
      Math.abs(existingTarget - scheduledTarget) <= 250
    ) {
      return;
    }

    clearPendingRefresh();

    availabilityRefreshTargetRef.current = scheduledTarget;
    availabilityRefreshTimerRef.current = window.setTimeout(() => {
      availabilityRefreshTimerRef.current = null;
      availabilityRefreshTargetRef.current = null;
      setAvailabilityRefreshKey((prev) => prev + 1);
    }, delay);
  }, [slots]);

  useEffect(() => {
    return () => {
      if (availabilityRefreshTimerRef.current !== null) {
        clearTimeout(availabilityRefreshTimerRef.current);
        availabilityRefreshTimerRef.current = null;
      }
      availabilityRefreshTargetRef.current = null;
      availabilityRefreshBackoffRef.current = MIN_AVAILABILITY_REFRESH_DELAY_MS;
      availabilityLastObservedExpiryRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!field?.field_code) {
      setFieldQuantities([]);
      return;
    }

    if (Array.isArray(field.quantities) && field.quantities.length > 0) {
      setFieldQuantities(field.quantities);
      return;
    }

    let ignore = false;
    (async () => {
      try {
        const data = await fetchFieldQuantities(field.field_code);
        if (!ignore) {
          setFieldQuantities(data.quantities ?? []);
        }
      } catch (error) {
        console.error("Không thể tải danh sách sân con:", error);
        if (!ignore) {
          setFieldQuantities([]);
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, [field?.field_code, field?.quantities]);

  const timeGroups = useMemo<TimeGroup[]>(() => {
    if (!slots.length) return [];

    const map = new Map<
      string,
      {
        aggregatedSlot?: FieldSlot;
        baseSlot?: FieldSlot;
        courts: FieldSlot[];
      }
    >();

    slots.forEach((slot) => {
      const key = `${slot.play_date}|${slot.start_time}|${slot.end_time}`;
      let entry = map.get(key);
      if (!entry) {
        entry = {
          aggregatedSlot: undefined,
          baseSlot: slot,
          courts: [],
        };
        map.set(key, entry);
      }

      if (slot.quantity_id === null || slot.quantity_id === undefined) {
        entry.aggregatedSlot = slot;
      } else {
        entry.courts.push(slot);
      }

      if (!entry.baseSlot) {
        entry.baseSlot = slot;
      }
    });

    const groups = Array.from(map.entries())
      .map(([key, entry]) => {
        const sortedCourts = entry.courts
          .filter(
            (court): court is FieldSlot => typeof court.quantity_id === "number"
          )
          .sort((a, b) => {
            const numA =
              (typeof a.quantity_number === "number"
                ? a.quantity_number
                : a.quantity_id) ?? 0;
            const numB =
              (typeof b.quantity_number === "number"
                ? b.quantity_number
                : b.quantity_id) ?? 0;
            return numA - numB;
          });

        const baseSlot =
          entry.aggregatedSlot ??
          entry.baseSlot ??
          sortedCourts[0] ??
          entry.courts[0];

        if (!baseSlot) {
          return null;
        }

        const courtsById = new Map<number, FieldSlot>();
        sortedCourts.forEach((court) => {
          if (typeof court.quantity_id === "number") {
            courtsById.set(court.quantity_id, court);
          }
        });

        const generateSyntheticSlotId = (
          originalSlotId: number,
          quantityId: number
        ) => {
          const base = Math.abs(originalSlotId) || 1;
          return -(base * 1000 + quantityId);
        };

        const templateSlot = (entry.aggregatedSlot ?? baseSlot) as FieldSlot;

        const sourceQuantities = fieldQuantities.length
          ? fieldQuantities
          : sortedCourts
              .filter((court) => typeof court.quantity_id === "number")
              .map((court) => ({
                quantity_id: court.quantity_id as number,
                quantity_number:
                  typeof court.quantity_number === "number"
                    ? court.quantity_number
                    : (court.quantity_id as number),
              }));

        const completeCourts = sourceQuantities
          .map((quantity) => {
            const quantityId = Number(quantity.quantity_id);
            if (!Number.isFinite(quantityId)) {
              return null;
            }

            const existing = courtsById.get(quantityId);
            if (existing) {
              return existing;
            }

            return {
              ...templateSlot,
              slot_id: generateSyntheticSlotId(
                templateSlot.slot_id,
                quantityId
              ),
              quantity_id: quantityId,
              quantity_number:
                typeof quantity.quantity_number === "number"
                  ? quantity.quantity_number
                  : quantityId,
              status: "available" as FieldSlot["status"],
              hold_expires_at: null,
              hold_expires_at_ts: null,
              is_available: true,
            } satisfies FieldSlot;
          })
          .filter((slot): slot is FieldSlot => Boolean(slot));

        const effectiveCourts =
          completeCourts.length > 0 ? completeCourts : sortedCourts;

        const isFullyBooked =
          effectiveCourts.length > 0 &&
          effectiveCourts.every(
            (court) => String(court.status ?? "").toLowerCase() !== "available"
          );

        return {
          key,
          baseSlot,
          courts: effectiveCourts,
          play_date: baseSlot.play_date,
          start_time: baseSlot.start_time,
          end_time: baseSlot.end_time,
          isFullyBooked,
        };
      })
      .filter(Boolean) as TimeGroup[];

    groups.sort((a, b) => {
      const dateCompare = a.play_date.localeCompare(b.play_date);
      if (dateCompare !== 0) return dateCompare;
      return a.start_time.localeCompare(b.start_time);
    });

    return groups;
  }, [slots, fieldQuantities]);

  const baseSlots = useMemo(
    () => timeGroups.map((group) => group.baseSlot),
    [timeGroups]
  );

  const slotGroupByBaseId = useMemo(() => {
    const map = new Map<number, TimeGroup>();
    timeGroups.forEach((group) => {
      map.set(group.baseSlot.slot_id, group);
    });
    return map;
  }, [timeGroups]);

  useEffect(() => {
    if (!baseSlots.length) {
      setSelectedSlotIds([]);
      return;
    }

    const sortedAvailable = [...baseSlots].sort((a, b) =>
      a.start_time.localeCompare(b.start_time)
    );

    const buildPrefillSelection = () => {
      if (
        !bookingPrefill ||
        bookingPrefill.date !== selectedDate ||
        !bookingPrefill.startTime
      ) {
        return [] as number[];
      }
      const requiredMinutes = Math.round(
        Math.max(0, (bookingPrefill.duration ?? 0) * 60)
      );
      if (requiredMinutes <= 0) {
        return [] as number[];
      }
      const startIndex = sortedAvailable.findIndex(
        (slot) => slot.start_time === bookingPrefill.startTime
      );
      if (startIndex === -1) {
        return [] as number[];
      }
      const collected: typeof sortedAvailable = [];
      let minutesLeft = requiredMinutes;
      for (
        let index = startIndex;
        index < sortedAvailable.length && minutesLeft > 0;
        index += 1
      ) {
        const current = sortedAvailable[index];
        if (index > startIndex) {
          const prev = sortedAvailable[index - 1];
          if (
            timeToMinutes(current.start_time) !== timeToMinutes(prev.end_time)
          ) {
            return [] as number[];
          }
        }
        const duration =
          timeToMinutes(current.end_time) - timeToMinutes(current.start_time);
        if (duration <= 0) {
          return [] as number[];
        }
        collected.push(current);
        minutesLeft -= duration;
      }

      if (minutesLeft > 0) {
        return [] as number[];
      }

      return collected.map((slot) => slot.slot_id);
    };

    setSelectedSlotIds((prev) => {
      const valid = prev.filter((id) =>
        sortedAvailable.some((slot) => slot.slot_id === id)
      );

      if (valid.length > 0) {
        if (valid.length === prev.length) {
          return prev;
        }
        return valid;
      }

      const prefillIds = buildPrefillSelection();
      if (prefillIds.length > 0) {
        return prefillIds;
      }

      return [];
    });
  }, [baseSlots, bookingPrefill, selectedDate]);

  const selectedSlots = useMemo(() => {
    if (!selectedSlotIds.length) return [];
    const slotMap = new Map(baseSlots.map((slot) => [slot.slot_id, slot]));
    return selectedSlotIds
      .map((id) => slotMap.get(id))
      .filter((slot): slot is FieldSlot => Boolean(slot))
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [selectedSlotIds, baseSlots]);

  const selectedGroups = useMemo(
    () =>
      selectedSlotIds
        .map((id) => slotGroupByBaseId.get(id))
        .filter((group): group is TimeGroup => Boolean(group)),
    [selectedSlotIds, slotGroupByBaseId]
  );

  const selectedRequiresCourtSelection = useMemo(
    () => selectedGroups.some((group) => group.courts.length > 0),
    [selectedGroups]
  );

  // Build court availability from fetched slots
  useEffect(() => {
    if (!field || selectedSlotIds.length === 0) {
      setCourtOptions([]);
      setSelectedQuantityID(undefined);
      setLoadingQuantities(false);
      return;
    }

    if (!selectedGroups.length) {
      setCourtOptions([]);
      setSelectedQuantityID(undefined);
      setLoadingQuantities(false);
      return;
    }

    if (!selectedRequiresCourtSelection) {
      setCourtOptions([]);
      setSelectedQuantityID(undefined);
      setLoadingQuantities(false);
      return;
    }

    setLoadingQuantities(true);

    let cancelled = false;

    const uniqueGroups = Array.from(
      new Map(
        selectedGroups.map((group) => [
          `${group.play_date}|${group.start_time}|${group.end_time}`,
          group,
        ])
      ).values()
    );

    const holdInfoByQuantity = new Map<
      number,
      { raw: string | null; ts: number | null }
    >();
    selectedGroups.forEach((group) => {
      group.courts.forEach((court) => {
        const quantityId = court.quantity_id;
        if (typeof quantityId !== "number") return;
        const status = String(court.status ?? "").toLowerCase();
        const holdExpiresAtTs =
          typeof court.hold_expires_at_ts === "number"
            ? court.hold_expires_at_ts
            : null;
        if (
          isHeldStatus(status) &&
          isHoldStillActive(court.hold_expires_at ?? null, holdExpiresAtTs)
        ) {
          holdInfoByQuantity.set(quantityId, {
            raw: court.hold_expires_at ?? null,
            ts: holdExpiresAtTs,
          });
        } else if (
          holdInfoByQuantity.has(quantityId) &&
          !isHoldStillActive(court.hold_expires_at ?? null, holdExpiresAtTs)
        ) {
          holdInfoByQuantity.delete(quantityId);
        }
      });
    });

    const baseQuantitiesMap = new Map<
      number,
      { quantity_id: number; quantity_number: number; baseStatus?: string }
    >();

    fieldQuantities.forEach((quantity) => {
      const quantityId = Number(quantity.quantity_id);
      if (!Number.isFinite(quantityId)) return;
      const quantityNumber =
        typeof quantity.quantity_number === "number"
          ? quantity.quantity_number
          : quantityId;
      baseQuantitiesMap.set(quantityId, {
        quantity_id: quantityId,
        quantity_number: quantityNumber,
        baseStatus: quantity.status,
      });
    });

    if (baseQuantitiesMap.size === 0) {
      selectedGroups.forEach((group) => {
        group.courts.forEach((court) => {
          const quantityId = court.quantity_id;
          if (typeof quantityId !== "number") return;
          const quantityNumber =
            typeof court.quantity_number === "number"
              ? court.quantity_number
              : quantityId;
          if (!baseQuantitiesMap.has(quantityId)) {
            baseQuantitiesMap.set(quantityId, {
              quantity_id: quantityId,
              quantity_number: quantityNumber,
            });
          }
        });
      });
    }

    (async () => {
      try {
        const responses = await Promise.all(
          uniqueGroups.map((group) =>
            fetchAvailableQuantities(
              field.field_code,
              group.play_date,
              group.start_time,
              group.end_time
            )
          )
        );

        if (cancelled) return;

        responses.forEach((response) => {
          response.availableQuantities.forEach((quantity) => {
            const quantityId = Number(quantity.quantity_id);
            if (!Number.isFinite(quantityId)) return;
            const quantityNumber =
              typeof quantity.quantity_number === "number"
                ? quantity.quantity_number
                : quantityId;
            if (!baseQuantitiesMap.has(quantityId)) {
              baseQuantitiesMap.set(quantityId, {
                quantity_id: quantityId,
                quantity_number: quantityNumber,
              });
            }
          });
          response.bookedQuantities.forEach((quantity) => {
            const quantityId = Number(quantity.quantity_id);
            if (!Number.isFinite(quantityId)) return;
            const quantityNumber =
              typeof quantity.quantity_number === "number"
                ? quantity.quantity_number
                : quantityId;
            if (!baseQuantitiesMap.has(quantityId)) {
              baseQuantitiesMap.set(quantityId, {
                quantity_id: quantityId,
                quantity_number: quantityNumber,
              });
            }
          });
        });

        const baseQuantitiesList = Array.from(baseQuantitiesMap.values());
        if (baseQuantitiesList.length === 0) {
          setCourtOptions([]);
          setSelectedQuantityID(undefined);
          return;
        }

        const aggregated = new Map<
          number,
          {
            quantity_id: number;
            quantity_number: number;
            statuses: CourtAvailabilityStatus[];
          }
        >();

        const ensureEntry = (quantityId: number, quantityNumber: number) => {
          if (!aggregated.has(quantityId)) {
            aggregated.set(quantityId, {
              quantity_id: quantityId,
              quantity_number: quantityNumber,
              statuses: [],
            });
          }
          return aggregated.get(quantityId)!;
        };

        const pushStatus = (
          quantityId: number,
          quantityNumber: number,
          status: CourtAvailabilityStatus
        ) => {
          const entry = ensureEntry(quantityId, quantityNumber);
          entry.statuses.push(status);
        };

        responses.forEach((response) => {
          const availableSet = new Set(
            response.availableQuantities
              .map((quantity) => Number(quantity.quantity_id))
              .filter((id) => Number.isFinite(id))
          );

          const bookedMap = new Map<number, CourtAvailabilityStatus>();
          response.bookedQuantities.forEach((quantity) => {
            const quantityId = Number(quantity.quantity_id);
            if (!Number.isFinite(quantityId)) return;
            const status = normalizeCourtStatusValue(
              quantity.status,
              holdInfoByQuantity.get(quantityId)?.raw ?? null,
              holdInfoByQuantity.get(quantityId)?.ts ?? null
            );
            bookedMap.set(quantityId, status === "held" ? "held" : "booked");
          });

          baseQuantitiesList.forEach((quantity) => {
            const { quantity_id: quantityId, quantity_number: quantityNumber } =
              quantity;
            if (!Number.isFinite(quantityId)) return;

            let status: CourtAvailabilityStatus;
            if (availableSet.has(quantityId)) {
              status = "available";
            } else {
              const bookedStatus = bookedMap.get(quantityId);
              if (bookedStatus === "held") {
                status = "held";
              } else if (bookedStatus === "booked") {
                status = "booked";
              } else if (
                quantity.baseStatus &&
                quantity.baseStatus !== "available"
              ) {
                const holdInfo = holdInfoByQuantity.get(quantityId);
                const baseNormalized = normalizeCourtStatusValue(
                  quantity.baseStatus,
                  holdInfo?.raw ?? null,
                  holdInfo?.ts ?? null
                );
                status = baseNormalized === "held" ? "held" : "booked";
              } else {
                status = "booked";
              }
            }

            pushStatus(quantityId, quantityNumber, status);
          });
        });

        const nextOptions: CourtAvailabilityOption[] = Array.from(
          aggregated.values()
        )

          .map((item) => {
            const finalStatus = item.statuses.every(
              (status) => status === "available"
            )
              ? "available"
              : item.statuses.some((status) => status === "held")
              ? "held"
              : "booked";

            const holdInfo = holdInfoByQuantity.get(item.quantity_id);
            const holdExpiresAt =
              finalStatus === "held" ? holdInfo?.raw ?? null : null;
            const holdExpiresAtTs =
              finalStatus === "held" ? holdInfo?.ts ?? null : null;

            return {
              quantity_id: item.quantity_id,
              quantity_number: item.quantity_number,
              status: finalStatus as CourtAvailabilityStatus,
              holdExpiresAt,
              holdExpiresAtTs,
            };
          })
          .sort((a, b) => a.quantity_number - b.quantity_number);

        setCourtOptions(nextOptions);
        setSelectedQuantityID((prev) => {
          if (!nextOptions.length) {
            return undefined;
          }
          if (
            typeof prev === "number" &&
            nextOptions.some(
              (option) =>
                option.quantity_id === prev && option.status === "available"
            )
          ) {
            return prev;
          }
          const firstAvailable = nextOptions.find(
            (option) => option.status === "available"
          );
          return firstAvailable ? firstAvailable.quantity_id : undefined;
        });
      } catch (error) {
        if (cancelled) return;
        console.error("Không thể tải danh sách sân trống:", error);
        setCourtOptions([]);
        setSelectedQuantityID(undefined);
        setSlotsError(
          (prev) =>
            prev ||
            "Không thể tải danh sách sân cho các khung giờ đã chọn. Vui lòng thử lại."
        );
      } finally {
        if (!cancelled) {
          setLoadingQuantities(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    field,
    selectedSlotIds,
    selectedGroups,
    selectedRequiresCourtSelection,
    fieldQuantities,
    availabilityRefreshKey,
  ]);

  useEffect(() => {
    if (!field?.shop?.shop_code) {
      setPromotionOptions([]);
      setPromotionError("");
      return;
    }
    let ignore = false;
    (async () => {
      try {
        setPromotionLoading(true);
        setPromotionError("");
        const data = await fetchActiveShopPromotions(field.shop.shop_code);
        if (!ignore) {
          setPromotionOptions(data);
        }
      } catch (error) {
        if (!ignore) {
          setPromotionOptions([]);
          setPromotionError(
            getErrorMessage(
              error,
              "Không thể tải danh sách khuyến mãi của sân."
            )
          );
        }
      } finally {
        if (!ignore) {
          setPromotionLoading(false);
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, [field?.shop?.shop_code]);

  const effectiveBooking: BookingDetails | null = useMemo(() => {
    if (!field || !selectedSlots.length || !selectedDate) return null;

    const totalMinutes = selectedSlots.reduce((acc, slot) => {
      const duration =
        timeToMinutes(slot.end_time) - timeToMinutes(slot.start_time);
      if (duration <= 0) {
        return acc;
      }
      return acc + duration;
    }, 0);

    if (totalMinutes <= 0) return null;

    const firstSlot = selectedSlots[0];
    const lastSlot = selectedSlots[selectedSlots.length - 1];

    let isContiguous = true;
    for (let i = 1; i < selectedSlots.length; i += 1) {
      const prev = selectedSlots[i - 1];
      const current = selectedSlots[i];
      if (timeToMinutes(prev.end_time) !== timeToMinutes(current.start_time)) {
        isContiguous = false;
        break;
      }
    }

    const duration = totalMinutes / 60;
    const hourlyPrice = resolveFieldPrice(field);
    const totalPrice = duration * hourlyPrice;
    return {
      date: selectedDate,
      startTime: firstSlot.start_time,
      endTime: lastSlot.end_time,
      duration,
      totalPrice,
      slotCount: selectedSlots.length,
      isContiguous,
    };
  }, [field, selectedDate, selectedSlots]);

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(value);

  const isAuthenticated = Boolean(user?.user_code);
  const normalizedPromotionCode = promotionCode.trim().toUpperCase();
  const selectedPromotion = useMemo(() => {
    if (!normalizedPromotionCode) return null;
    return (
      promotionOptions.find(
        (item) => item.promotion_code === normalizedPromotionCode
      ) ?? null
    );
  }, [promotionOptions, normalizedPromotionCode]);

  // Use consolidated price calculation hook
  const priceCalc = usePriceCalculation(
    effectiveBooking,
    selectedPromotion,
    isAuthenticated,
    promotionCode
  );

  const promotionDiscount = priceCalc.discount;
  const finalPreviewTotal = priceCalc.final;
  const promotionFeedback = priceCalc.feedback;
  const promotionFeedbackClass = priceCalc.feedbackClass;

  const hasPromotionApplied = promotionDiscount > 0;

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [confirmation, setConfirmation] =
    useState<ConfirmBookingResponse | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormData>({
    defaultValues: {
      customer_name: user?.user_name || "",
      customer_email: user?.email || "",
      payment_method: "banktransfer",
    },
  });

  const onSubmit = async (formData: BookingFormData) => {
    if (!field || !effectiveBooking || !selectedSlots.length) {
      setSlotsError("Vui lòng chọn khung giờ trống trước khi tiếp tục.");
      return;
    }

    // Require court selection only when the selected slots include multiple courts
    if (selectedRequiresCourtSelection && !selectedQuantityID) {
      setSlotsError("Vui lòng chọn sân trước khi tiếp tục.");
      return;
    }

    setIsProcessing(true);
    setSlotsError("");
    setIsSuccess(false);
    setConfirmation(null);

    try {
      const selectedCourt =
        typeof selectedQuantityID === "number"
          ? courtOptions.find(
              (option) => option.quantity_id === selectedQuantityID
            )
          : undefined;

      const createdBy =
        typeof user?.user_code === "number"
          ? Number(user.user_code)
          : undefined;

      const slotsPayload = selectedSlots.map((slot) => {
        const slotQuantityId =
          typeof slot.quantity_id === "number" ? slot.quantity_id : undefined;
        const slotQuantityNumber =
          typeof slot.quantity_number === "number"
            ? slot.quantity_number
            : undefined;

        const effectiveQuantityId = selectedRequiresCourtSelection
          ? selectedQuantityID
          : slotQuantityId;

        const effectiveQuantityNumber = selectedRequiresCourtSelection
          ? selectedCourt?.quantity_number
          : slotQuantityNumber;

        return {
          slot_id: Number(slot.slot_id),
          play_date: slot.play_date,
          start_time: slot.start_time,
          end_time: slot.end_time,
          ...(typeof effectiveQuantityId === "number"
            ? { quantity_id: effectiveQuantityId }
            : {}),
          ...(typeof effectiveQuantityNumber === "number"
            ? { quantity_number: effectiveQuantityNumber }
            : {}),
        };
      });

      const payload: ConfirmBookingPayload = {
        slots: slotsPayload,
        payment_method: formData.payment_method,
        total_price: finalPreviewTotal,
        customer: {
          name: formData.customer_name,
          email: formData.customer_email,
          phone: formData.customer_phone,
        },
        notes: formData.notes,
      };

      if (
        typeof createdBy === "number" &&
        Number.isFinite(createdBy) &&
        createdBy > 0
      ) {
        payload.created_by = createdBy;
      }

      if (
        selectedRequiresCourtSelection &&
        typeof selectedQuantityID === "number"
      ) {
        payload.quantity_id = selectedQuantityID;
      }

      if (isAuthenticated && normalizedPromotionCode) {
        payload.promotion_code = normalizedPromotionCode;
      }

      if (isAuthenticated) {
        payload.isLoggedInCustomer = true;
      }

      const response = await confirmFieldBooking(field.field_code, payload);
      setConfirmation(response);
      setIsSuccess(true);

      if (response?.booking_code) {
        navigate(`/payment/${response.booking_code}/transfer`, {
          state: {
            qrCode: response.qr_code,
            paymentID: response.paymentID,
            amount: response.amount,
          },
        });
      }
    } catch (error: unknown) {
      setIsSuccess(false);

      // Handle 409 Conflict error - court already booked
      const isConflictError =
        error instanceof Error &&
        (error.message.includes("409") ||
          error.message.includes("đã được đặt") ||
          error.message.includes("Sân"));

      if (isConflictError) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Sân này đã được đặt trong khung giờ này";
        setSlotsError(errorMessage);

        // Refresh available quantities to show updated list
        if (selectedSlots.length > 0) {
          try {
            if (field?.field_code && selectedDate) {
              setLoadingSlots(true);
              const refreshed = await fetchFieldAvailability(
                field.field_code,
                selectedDate
              );
              setSlots(refreshed.slots ?? []);
              if (!refreshed.slots?.length) {
                setSlotsError("Ngày này chưa mở lịch hoặc đã kín lịch.");
              }
              setLoadingSlots(false);
            }
            setSelectedQuantityID(undefined);
          } catch (refreshError) {
            console.error(
              "Error refreshing available quantities:",
              refreshError
            );
            setLoadingSlots(false);
          }
        }
      } else {
        const message = getErrorMessage(
          error,
          "Không thể xác nhận thanh toán. Vui lòng thử lại."
        );
        setSlotsError(message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const minSelectableDate = todayString();

  const handleDateChange = (value: string) => {
    setSelectedDate(value);
    setSelectedSlotIds([]);
    setSlotsError("");
  };

  const durationLabel = effectiveBooking
    ? minutesToLabel(Math.round(effectiveBooking.duration * 60))
    : null;

  const primaryImage = field?.images?.[0];
  const fieldCoverImage =
    resolveImageUrl(primaryImage?.image_url, primaryImage?.storage) ||
    "https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg";

  const isFieldLoading = loadingField && !field;
  const hasSelectedSlots = Boolean(effectiveBooking);

  if (isSuccess && confirmation && field && effectiveBooking) {
    const paymentMethodLabel = (() => {
      const method = confirmation.payment_method
        ? confirmation.payment_method.toString().toLowerCase()
        : "";
      if (["banktransfer", "bank_transfer"].includes(method)) {
        return "Chuyển khoản ngân hàng";
      }
      if (method === "ewallet") return "Ví điện tử";
      if (method === "card") return "Thẻ";
      if (method === "cash") return "Tiền mặt";
      return confirmation.payment_method || "Không xác định";
    })();

    const paymentStatusLabel = (() => {
      const status = confirmation.payment_status
        ? confirmation.payment_status.toString()
        : "";
      if (!status) return "Không xác định";
      if (status === "mock_success") {
        return "Thanh toán mô phỏng thành công";
      }
      return status.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
    })();

    const amountBeforeDiscount =
      confirmation.amount_before_discount ?? effectiveBooking.totalPrice;
    const computedFinalAmount = confirmation.amount ?? amountBeforeDiscount;
    const discountApplied =
      confirmation.discount_amount ??
      Math.max(amountBeforeDiscount - computedFinalAmount, 0);

    const transactionId =
      confirmation.transaction_id && confirmation.transaction_id.trim()
        ? confirmation.transaction_id
        : "Đang chờ cấp";

    const holdExpiresAt =
      confirmation.hold_expires_at && confirmation.hold_expires_at.trim()
        ? new Date(confirmation.hold_expires_at)
        : null;

    return (
      <div className="page">
        <div className="container">
          <div className="section text-center">
            <div className="success-icon">
              <CheckCircle className="success-icon-inner" />
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Đặt sân thành công!
            </h2>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-bold text-green-800 mb-2">
                Mã đặt sân của bạn:
              </h3>
              <div className="text-3xl font-mono font-bold text-green-600 bg-white p-4 rounded border-2 border-green-300">
                {confirmation.booking_code}
              </div>
              <p className="text-sm text-green-700 mt-2">
                Vui lòng lưu mã này để check-in khi đến sân.
              </p>
            </div>

            <div className="mb-6 grid gap-3 text-left md:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Phương thức thanh toán
                </p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {paymentMethodLabel}
                </p>
                <p className="text-xs text-gray-500">
                  Mã: {confirmation.payment_method}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Trạng thái thanh toán
                </p>
                <p className="mt-1 text-sm font-medium text-emerald-700">
                  {paymentStatusLabel}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Mã giao dịch
                </p>
                <p className="mt-1 font-mono text-sm text-gray-900">
                  {transactionId}
                </p>
              </div>
            </div>

            <div className="text-left bg-gray-50 rounded-lg p-6 mb-6 space-y-2">
              <h4 className="font-bold text-gray-900 mb-3">
                Chi tiết đặt sân:
              </h4>
              <div>
                <strong>Sân:</strong> {field.field_name}
              </div>
              {selectedQuantityID && courtOptions.length > 0 && (
                <div>
                  <strong>Số sân:</strong> Sân{" "}
                  {
                    courtOptions.find(
                      (q) => q.quantity_id === selectedQuantityID
                    )?.quantity_number
                  }
                </div>
              )}
              <div>
                <strong>Ngày:</strong>{" "}
                {new Date(effectiveBooking.date).toLocaleDateString("vi-VN")}
              </div>
              <div>
                <strong>Giờ:</strong> {effectiveBooking.startTime} -{" "}
                {effectiveBooking.endTime} (
                {minutesToLabel(Math.round(effectiveBooking.duration * 60))})
              </div>
              <div>
                <strong>Giá gốc:</strong> {formatPrice(amountBeforeDiscount)}
              </div>
              {discountApplied > 0 && (
                <div className="text-emerald-600">
                  <strong>Giảm:</strong> -{formatPrice(discountApplied)}
                  {confirmation.promotion_code
                    ? ` (Mã ${confirmation.promotion_code})`
                    : ""}
                </div>
              )}
              <div>
                <strong>Tổng tiền:</strong> {formatPrice(computedFinalAmount)}
              </div>
              <div>
                <strong>Địa chỉ:</strong> {field.address}
              </div>
              {holdExpiresAt && !Number.isNaN(holdExpiresAt.getTime()) && (
                <div>
                  <strong>Giữ chỗ đến:</strong>{" "}
                  {holdExpiresAt.toLocaleString("vi-VN")}
                </div>
              )}
            </div>

            {holdExpiresAt &&
              !Number.isNaN(holdExpiresAt.getTime()) &&
              isAuthenticated && (
                <p className="text-sm text-gray-600 mb-6">
                  Bạn có thể tiếp tục thanh toán sau trong{" "}
                  <Link
                    to="/cart"
                    className="font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    Giỏ hàng
                  </Link>{" "}
                  miễn là thời gian giữ chỗ còn hiệu lực.
                </p>
              )}

            <div className="space-y-3">
              <button
                onClick={() => navigate("/")}
                className="btn-primary w-full"
              >
                Về trang chủ
              </button>
              <button
                onClick={() => navigate("/fields")}
                className="btn-ghost w-full"
              >
                Đặt sân khác
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Lưu ý:</strong> Vui lòng đến sân trước 15 phút so với
                giờ đặt. Mang theo mã đặt sân, mã giao dịch và giấy tờ tùy thân
                để xác nhận. Thông tin chi tiết đã được gửi tới email của bạn.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isSuccess && !loadingField && fieldError) {
    return (
      <div className="page">
        <div className="container">
          <div className="section text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h2 className="text-2xl font-semibold text-gray-900">
              Không thể tải thông tin sân
            </h2>
            <p className="text-gray-600">{fieldError}</p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                if (!id) return;
                setFieldError("");
                setLoadingField(true);
                void (async () => {
                  try {
                    const fetched = await fetchFieldById(Number(id));
                    setField(fetched ?? null);
                    setFieldError("");
                  } catch (error: unknown) {
                    const message = getErrorMessage(
                      error,
                      "Không thể tải thông tin sân. Vui lòng thử lại."
                    );
                    setFieldError(message);
                    setField(null);
                  } finally {
                    setLoadingField(false);
                  }
                })();
              }}
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isSuccess && !loadingField && !field) {
    return (
      <div className="page">
        <div className="container">
          <div className="section text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
            <h2 className="text-2xl font-semibold text-gray-900">
              Không tìm thấy sân
            </h2>
            <p className="text-gray-600">
              Vui lòng quay lại trang chi tiết sân để chọn lại.
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate(`/fields/${id ?? ""}`)}
            >
              Quay lại trang sân
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page bg-slate-50/80 pb-10">
      <div className="container max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => navigate(-1)}
            className="btn-link inline-flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="w-5 h-5" />
            Quay lại
          </button>
          {field?.field_code && (
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Mã sân: {field.field_code}
            </span>
          )}
        </div>

        <div className="mb-8">
          <ol className="flex flex-wrap items-center gap-3 text-sm">
            <li className="flex items-center gap-2 rounded-full border border-emerald-400 bg-emerald-50 px-3 py-1 text-emerald-700">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-semibold text-white">
                1
              </span>
              Chọn khung giờ
            </li>
            <li
              className={`flex items-center gap-2 rounded-full border px-3 py-1 ${
                hasSelectedSlots
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 text-gray-600"
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                  hasSelectedSlots
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                2
              </span>
              Nhập thông tin
            </li>
            <li className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-gray-500">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700">
                3
              </span>
              Xác nhận thanh toán
            </li>
          </ol>
        </div>

        <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            <section className="section space-y-6">
              <div>
                {isFieldLoading ? (
                  <div className="rounded-xl border border-gray-200 bg-white/70 p-4 shadow-sm">
                    <div className="flex animate-pulse gap-4">
                      <div className="h-20 w-20 rounded-lg bg-gray-200" />
                      <div className="flex-1 space-y-3">
                        <div className="h-4 w-2/3 rounded bg-gray-200" />
                        <div className="h-3 w-1/2 rounded bg-gray-200" />
                        <div className="h-3 w-3/4 rounded bg-gray-200" />
                      </div>
                    </div>
                  </div>
                ) : field ? (
                  <div className="rounded-xl border border-gray-200 bg-white/90 p-4 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex gap-3">
                        <div className="h-20 w-20 overflow-hidden rounded-lg bg-gray-100 shadow-inner">
                          <img
                            src={fieldCoverImage}
                            alt={field.field_name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                            {field.shop?.shop_name || "Cơ sở"}
                          </p>
                          <h1 className="text-xl font-bold text-gray-900">
                            {field.field_name}
                          </h1>
                          <p className="text-sm text-gray-600">
                            {field.address}
                          </p>
                        </div>
                      </div>
                      <div className="grid w-full gap-3 text-sm md:w-auto md:grid-cols-2">
                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                          <span className="block text-xs uppercase tracking-wide text-gray-500">
                            Giá / giờ
                          </span>
                          <span className="mt-1 block font-semibold text-gray-900">
                            {(() => {
                              const hourly = resolveFieldPrice(field);
                              return hourly > 0
                                ? formatPrice(hourly)
                                : "Liên hệ";
                            })()}
                          </span>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                          <span className="block text-xs uppercase tracking-wide text-gray-500">
                            Loại sân
                          </span>
                          <span className="mt-1 block font-semibold text-gray-900 capitalize">
                            {getSportLabel(field.sport_type)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-yellow-700">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span>
                      Không tìm thấy thông tin sân. Vui lòng quay lại trang
                      trước.
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    1. Chọn ngày và khung giờ
                  </h2>
                </div>

                <div className="grid gap-4 md:grid-cols-[220px,1fr]">
                  <div>
                    <label className="label inline-flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Ngày đặt
                    </label>
                    <input
                      type="date"
                      className="input"
                      min={minSelectableDate}
                      value={selectedDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      disabled={isFieldLoading}
                    />
                  </div>
                  <div className="rounded-lg border border-dashed border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-700">
                    {hasSelectedSlots && effectiveBooking ? (
                      <div className="space-y-1">
                        <span>
                          Đã chọn{" "}
                          {new Date(effectiveBooking.date).toLocaleDateString(
                            "vi-VN"
                          )}{" "}
                          • {effectiveBooking.startTime} -{" "}
                          {effectiveBooking.endTime} ({durationLabel},{" "}
                          {effectiveBooking.slotCount} khung giờ)
                        </span>
                        {!effectiveBooking.isContiguous && (
                          <span className="block text-xs text-amber-700">
                            Lưu ý: các khung giờ đã chọn không liền kề nhau.
                          </span>
                        )}
                      </div>
                    ) : (
                      <span>
                        Chọn ngày và khung giờ phù hợp để tiếp tục điền thông
                        tin đặt sân.
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="label inline-flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Khung giờ trống
                  </label>
                  {loadingSlots ? (
                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="spinner" />
                      Đang tải khung giờ...
                    </div>
                  ) : timeGroups.length > 0 ? (
                    <>
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {timeGroups.map((group) => {
                          const slot = group.baseSlot;
                          const slotState = deriveSlotState(slot);
                          const isSelectable = !group.isFullyBooked;
                          const {
                            isHeld,
                            isBooked,
                            isBlocked,
                            normalizedStatus,
                          } = slotState;
                          const matchesSelectedCourt =
                            typeof selectedQuantityID === "number" &&
                            group.courts.some(
                              (court) =>
                                typeof court.quantity_id === "number" &&
                                court.quantity_id === selectedQuantityID
                            );
                          const isActive =
                            isSelectable &&
                            selectedSlotIds.includes(slot.slot_id);
                          const slotDurationMinutes =
                            timeToMinutes(slot.end_time) -
                            timeToMinutes(slot.start_time);
                          const slotDurationText =
                            slotDurationMinutes > 0
                              ? minutesToLabel(slotDurationMinutes)
                              : "";
                          const holdInfo = isHeld
                            ? formatHoldExpiresAt(
                                slot.hold_expires_at,
                                slot.hold_expires_at_ts ?? null
                              )
                            : "";
                          const statusLabel = (() => {
                            if (!isSelectable) {
                              return "Đã hết sân";
                            }
                            if (slotState.isAvailable) {
                              return "Có thể đặt";
                            }
                            if (isHeld) {
                              return "Đang giữ chỗ";
                            }
                            if (isBooked) {
                              return "Có thể đặt";
                            }
                            if (isBlocked) {
                              return "Không khả dụng";
                            }
                            if (normalizedStatus) {
                              return normalizedStatus
                                .replace(/_/g, " ")
                                .replace(/^\w/, (c) => c.toUpperCase());
                            }
                            return "Không khả dụng";
                          })();
                          const badgeClasses = (() => {
                            if (isActive) {
                              return "bg-emerald-500 text-white";
                            }
                            if (isSelectable) {
                              return "bg-emerald-100 text-emerald-700";
                            }
                            if (isHeld) {
                              return "bg-amber-100 text-amber-700";
                            }
                            return "bg-gray-200 text-gray-600";
                          })();
                          const buttonClasses = [
                            "relative flex h-full flex-col gap-2 rounded-xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-1",
                            isActive
                              ? "border-emerald-500 bg-emerald-50 shadow-sm"
                              : isHeld
                              ? "border-amber-200 bg-amber-50/70"
                              : isSelectable
                              ? "border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/60"
                              : "border-gray-200 bg-gray-100 text-gray-500",
                            matchesSelectedCourt && !isActive
                              ? "ring-1 ring-emerald-200"
                              : "",
                            !isSelectable
                              ? "cursor-not-allowed opacity-70"
                              : "",
                          ].join(" ");
                          const totalCourts = group.courts.length;
                          const courtStatuses = group.courts.map((court) => {
                            const normalized = normalizeCourtStatusValue(
                              court.status,
                              court.hold_expires_at ?? null,
                              court.hold_expires_at_ts ?? null
                            );
                            return {
                              status: normalized,
                              holdExpiresAt: court.hold_expires_at ?? null,
                              holdExpiresAtTs: court.hold_expires_at_ts ?? null,
                            };
                          });
                          const availableCourtCount = courtStatuses.filter(
                            (item) => item.status === "available"
                          ).length;
                          const heldCourtCount = courtStatuses.filter(
                            (item) => item.status === "held"
                          ).length;

                          return (
                            <button
                              key={slot.slot_id}
                              type="button"
                              onClick={() => {
                                if (!isSelectable) return;
                                setSelectedSlotIds((prev) => {
                                  const exists = prev.includes(slot.slot_id);
                                  const next = exists
                                    ? prev.filter((id) => id !== slot.slot_id)
                                    : [...prev, slot.slot_id];
                                  if (!next.length) {
                                    return [];
                                  }
                                  const slotMap = new Map(
                                    baseSlots.map((entry) => [
                                      entry.slot_id,
                                      entry,
                                    ])
                                  );
                                  return next
                                    .map((id) => slotMap.get(id))
                                    .filter((entry): entry is FieldSlot =>
                                      Boolean(entry)
                                    )
                                    .sort((a, b) =>
                                      a.start_time.localeCompare(b.start_time)
                                    )
                                    .map((entry) => entry.slot_id);
                                });
                                setSlotsError("");
                              }}
                              disabled={!isSelectable}
                              className={buttonClasses}
                              aria-pressed={isActive}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-gray-900">
                                  {slot.start_time} - {slot.end_time}
                                </span>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeClasses}`}
                                >
                                  {statusLabel}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>{slotDurationText}</span>
                                <div className="flex items-center gap-2">
                                  {totalCourts > 0 && (
                                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                                      {availableCourtCount}/{totalCourts} sân
                                      trống
                                    </span>
                                  )}
                                  {heldCourtCount > 0 && (
                                    <span className="font-medium text-amber-600">
                                      {heldCourtCount} sân đang giữ
                                    </span>
                                  )}
                                  {holdInfo && (
                                    <span className="font-medium text-amber-600">
                                      Giữ đến {holdInfo}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {!isSelectable && totalCourts > 0 && (
                                <span className="text-xs text-gray-500">
                                  Khung giờ này đã hết sân.
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-yellow-700">
                      <AlertCircle className="h-5 w-5 shrink-0" />
                      <span>
                        {slotsError || "Ngày này chưa có lịch trống được mở."}
                      </span>
                    </div>
                  )}
                  {slotsError && timeGroups.length > 0 && (
                    <p className="mt-2 text-sm text-red-600">{slotsError}</p>
                  )}
                </div>

                {effectiveBooking && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                          Khung giờ đã chọn
                        </p>
                        <p className="text-base font-semibold text-emerald-900">
                          {new Date(effectiveBooking.date).toLocaleDateString(
                            "vi-VN"
                          )}{" "}
                          • {effectiveBooking.startTime} -{" "}
                          {effectiveBooking.endTime}
                        </p>
                      </div>
                      <div className="text-sm text-emerald-700">
                        <span className="font-medium">Thời lượng:</span>{" "}
                        {durationLabel}
                        <span className="ml-3 font-medium">
                          Khung giờ:
                        </span>{" "}
                        {effectiveBooking.slotCount}
                      </div>
                    </div>
                  </div>
                )}

                {selectedSlots.length > 0 &&
                  (selectedRequiresCourtSelection ||
                    loadingQuantities ||
                    courtOptions.length > 0) && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <AvailableCourtSelector
                        courts={courtOptions}
                        selectedQuantityID={selectedQuantityID}
                        onSelectCourt={setSelectedQuantityID}
                        loading={loadingQuantities}
                      />
                    </div>
                  )}
              </div>
            </section>

            <section className="section space-y-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  2. Thông tin người đặt
                </h2>
                <p className="text-sm text-gray-500">
                  Nhập chính xác để nhận mã đặt sân và thông báo từ hệ thống.
                </p>
              </div>

              {!field || !effectiveBooking ? (
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-blue-700">
                  Vui lòng chọn ngày và khung giờ trước khi nhập thông tin đặt
                  sân.
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="label text-sm font-medium text-gray-700">
                        Họ và tên <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          {...register("customer_name", {
                            required: "Vui lòng nhập họ và tên",
                            minLength: {
                              value: 2,
                              message: "Ít nhất 2 ký tự",
                            },
                          })}
                          className="input pl-10"
                          placeholder="Nhập họ và tên của bạn"
                        />
                      </div>
                      {errors.customer_name && (
                        <p className="text-sm text-red-500">
                          {errors.customer_name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="label text-sm font-medium text-gray-700">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          type="email"
                          {...register("customer_email", {
                            required: "Vui lòng nhập email",
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: "Email không hợp lệ",
                            },
                          })}
                          className="input pl-10"
                          placeholder="Nhập email của bạn"
                        />
                      </div>
                      {errors.customer_email && (
                        <p className="text-sm text-red-500">
                          {errors.customer_email.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="label text-sm font-medium text-gray-700">
                        Số điện thoại <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          type="tel"
                          {...register("customer_phone", {
                            required: "Vui lòng nhập số điện thoại",
                            pattern: {
                              value: /^[0-9]{10,11}$/,
                              message: "Số điện thoại phải có 10-11 chữ số",
                            },
                          })}
                          className="input pl-10"
                          placeholder="Nhập số điện thoại của bạn"
                          inputMode="tel"
                        />
                      </div>
                      {errors.customer_phone && (
                        <p className="text-sm text-red-500">
                          {errors.customer_phone.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="label inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                        <CreditCard className="h-4 w-4" />
                        Phương thức thanh toán
                      </label>
                      <label className="radio-tile">
                        <div className="radio-body">
                          <div className="flex items-center justify-between">
                            <input
                              type="radio"
                              value="banktransfer"
                              {...register("payment_method")}
                              defaultChecked
                            />
                            <span className="font-medium text-gray-900">
                              Thanh toán mã QR (Sepay)
                            </span>
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                              Khuyến nghị
                            </span>
                          </div>
                          <p className="card-subtitle">
                            Thanh toán an toàn qua chuyển khoản sau khi hệ thống
                            xác nhận giữ chỗ.
                          </p>
                        </div>
                      </label>
                      <p className="text-xs text-gray-500">
                        Hướng dẫn chuyển khoản chi tiết sẽ được gửi qua email
                        cùng mã đặt sân.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="label text-sm font-medium text-gray-700">
                      Ghi chú (tùy chọn)
                    </label>
                    <textarea
                      {...register("notes")}
                      rows={3}
                      className="input min-h-[100px] resize-y"
                      placeholder="Ví dụ: muốn mượn bóng, yêu cầu chuẩn bị nước uống..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="btn-primary flex w-full items-center justify-center gap-3"
                    aria-busy={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>Đang xử lý thanh toán...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5" />
                        <span>Xác nhận đặt sân</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </section>
          </div>

          <div className="lg:col-span-1">
            <aside className="section sticky top-8 space-y-5">
              <h3 className="text-xl font-bold text-gray-900">
                Tóm tắt đặt sân
              </h3>

              {isFieldLoading ? (
                <div className="loading-wrap">
                  <div className="spinner" />
                </div>
              ) : field ? (
                <div className="space-y-5">
                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <img
                      src={fieldCoverImage}
                      alt={field.field_name}
                      className="h-40 w-full object-cover"
                    />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {field.field_name}
                    </h4>
                    <p className="text-sm text-gray-600 capitalize">
                      {getSportLabel(field.sport_type)}
                    </p>
                    <p className="text-sm text-gray-500">{field.address}</p>
                    {field.shop?.shop_name && (
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        {field.shop.shop_name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Ngày
                      </span>
                      <span className="font-medium">
                        {effectiveBooking
                          ? new Date(effectiveBooking.date).toLocaleDateString(
                              "vi-VN"
                            )
                          : "-"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Giờ
                      </span>
                      <span className="font-medium">
                        {effectiveBooking
                          ? `${effectiveBooking.startTime} - ${effectiveBooking.endTime}`
                          : "-"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Thời lượng</span>
                      <span className="font-medium">
                        {durationLabel ?? "-"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Số khung giờ</span>
                      <span className="font-medium">
                        {effectiveBooking ? effectiveBooking.slotCount : "-"}
                      </span>
                    </div>

                    {effectiveBooking && !effectiveBooking.isContiguous && (
                      <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        Các khung giờ được chọn không liền nhau. Vui lòng kiểm
                        tra lại trước khi xác nhận.
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 rounded-xl border border-gray-200 bg-white px-4 py-3">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <BadgePercent className="h-4 w-4" /> Mã khuyến mãi
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promotionCode}
                        onChange={(event) =>
                          setPromotionCode(event.target.value.toUpperCase())
                        }
                        placeholder="Nhập mã (nếu có)"
                        className="input flex-1 uppercase"
                        disabled={promotionLoading}
                      />
                      {promotionCode ? (
                        <button
                          type="button"
                          className="btn-outline shrink-0"
                          onClick={() => setPromotionCode("")}
                          title="Xoá mã khuyến mãi"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                    {promotionLoading && (
                      <p className="text-xs text-gray-500">
                        Đang tải khuyến mãi...
                      </p>
                    )}
                    {promotionError && (
                      <p className="text-xs text-red-600">{promotionError}</p>
                    )}
                    {promotionFeedback && (
                      <p className={`text-xs ${promotionFeedbackClass}`}>
                        {promotionFeedback}
                      </p>
                    )}
                    {promotionOptions.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {promotionOptions.map((promo) => {
                          const isSelected =
                            promo.promotion_code === normalizedPromotionCode;
                          const meetsMin = effectiveBooking
                            ? effectiveBooking.totalPrice >=
                              (promo.min_order_amount ?? 0)
                            : false;
                          return (
                            <button
                              key={promo.promotion_id}
                              type="button"
                              onClick={() =>
                                setPromotionCode(promo.promotion_code)
                              }
                              title={promo.title}
                              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                                isSelected
                                  ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                                  : "border-gray-200 text-gray-600 hover:border-emerald-400"
                              } ${!meetsMin ? "opacity-60" : ""}`}
                            >
                              {promo.promotion_code}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <div className="flex items-center justify-between text-sm text-gray-700">
                      <span>Giá gốc</span>
                      <span className="font-medium">
                        {effectiveBooking
                          ? formatPrice(effectiveBooking.totalPrice)
                          : "-"}
                      </span>
                    </div>
                    {hasPromotionApplied && (
                      <div className="mt-1 flex items-center justify-between text-sm text-emerald-600">
                        <span>Giảm</span>
                        <span>-{formatPrice(promotionDiscount)}</span>
                      </div>
                    )}
                    <div className="mt-2 flex items-center justify-between text-lg font-bold">
                      <span className="flex items-center gap-1">Tạm tính</span>
                      <span className="text-emerald-600">
                        {effectiveBooking
                          ? formatPrice(finalPreviewTotal)
                          : "-"}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-emerald-700">
                      Giá tạm tính dựa trên thời lượng đã chọn.
                      {hasPromotionApplied
                        ? " Đã bao gồm khuyến mãi áp dụng."
                        : " Hoàn tất thanh toán để đảm bảo giữ chỗ."}
                    </p>
                  </div>

                  <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800">
                    Sau khi xác nhận, mã đặt sân và hướng dẫn thanh toán sẽ được
                    gửi qua email của bạn.
                  </div>
                </div>
              ) : (
                <div className="card-subtitle">
                  Không tìm thấy thông tin sân.
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
