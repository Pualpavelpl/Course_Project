import { z } from "zod";
import {
  createCvRequestSchema,
  deleteCvRequestSchema,
  getCvRequestSchema,
  listCvsRequestSchema,
  updateCvProfileAttributesRequestSchema,
} from "../cvs/cv.validation.js";
import {
  createProfileAttributeRequestSchema,
  deleteProfileAttributeRequestSchema,
  getMyProfileRequestSchema,
  listAvailableProfileAttributesRequestSchema,
  updateMyProfileRequestSchema,
  updateProfileAttributeRequestSchema,
} from "../profiles/profile.validation.js";
import {
  createProjectRequestSchema,
  deleteProjectRequestSchema,
  getProjectRequestSchema,
  listProjectsRequestSchema,
  updateProjectRequestSchema,
} from "../projects/project.validation.js";

const candidateIdParamsSchema = z.strictObject({
  candidateId: z.uuid(),
});
const candidateAttributeParamsSchema = candidateIdParamsSchema.extend({
  attributeId: z.uuid(),
});
const candidateProjectParamsSchema = candidateIdParamsSchema.extend({
  projectId: z.uuid(),
});
const candidateCvParamsSchema = candidateIdParamsSchema.extend({
  cvId: z.uuid(),
});

export const adminGetProfileRequestSchema =
  getMyProfileRequestSchema.extend({
    params: candidateIdParamsSchema,
  });
export const adminUpdateProfileRequestSchema =
  updateMyProfileRequestSchema.extend({
    params: candidateIdParamsSchema,
  });
export const adminListAvailableAttributesRequestSchema =
  listAvailableProfileAttributesRequestSchema.extend({
    params: candidateIdParamsSchema,
  });
export const adminCreateProfileAttributeRequestSchema =
  createProfileAttributeRequestSchema.extend({
    params: candidateIdParamsSchema,
  });
export const adminUpdateProfileAttributeRequestSchema =
  updateProfileAttributeRequestSchema.extend({
    params: candidateAttributeParamsSchema,
  });
export const adminDeleteProfileAttributeRequestSchema =
  deleteProfileAttributeRequestSchema.extend({
    params: candidateAttributeParamsSchema,
  });

export const adminListProjectsRequestSchema =
  listProjectsRequestSchema.extend({
    params: candidateIdParamsSchema,
  });
export const adminGetProjectRequestSchema = getProjectRequestSchema.extend({
  params: candidateProjectParamsSchema,
});
export const adminCreateProjectRequestSchema =
  createProjectRequestSchema.extend({
    params: candidateIdParamsSchema,
  });
export const adminUpdateProjectRequestSchema =
  updateProjectRequestSchema.extend({
    params: candidateProjectParamsSchema,
  });
export const adminDeleteProjectRequestSchema =
  deleteProjectRequestSchema.extend({
    params: candidateProjectParamsSchema,
  });

export const adminListCvsRequestSchema = listCvsRequestSchema.extend({
  params: candidateIdParamsSchema,
});
export const adminCreateCvRequestSchema = createCvRequestSchema.extend({
  params: candidateIdParamsSchema,
});
export const adminGetCvRequestSchema = getCvRequestSchema.extend({
  params: candidateCvParamsSchema,
});
export const adminUpdateCvRequestSchema =
  updateCvProfileAttributesRequestSchema.extend({
    params: candidateCvParamsSchema,
  });
export const adminDeleteCvRequestSchema = deleteCvRequestSchema.extend({
  params: candidateCvParamsSchema,
});
