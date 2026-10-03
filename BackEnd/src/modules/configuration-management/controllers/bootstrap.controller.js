import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';
import bootstrapService from '../services/bootstrap.service.js';

const bootstrapController = {
  getBootstrap: asyncHandler(async (req, res) => {
    sendSuccess(res, await bootstrapService.getBootstrapData());
  })
};

export default bootstrapController;
