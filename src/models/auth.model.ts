import authQueries from "../queries/auth.queries";
import queryService from "../services/query";

const authModel = {
  async getUserAuth(login: string) {
    return await queryService.execQueryOne(authQueries.getUserAuth, [
      login,
      login,
    ]);
  },
};

export default authModel;
