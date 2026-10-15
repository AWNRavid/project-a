import { createProject } from "./create-project";
import { deleteProject } from "./delete-project";
import { getAllProject } from "./get-all-project";
import { updateProject } from "./update-project";

const projectRouter = {
  createProject,
  getAllProject,
  updateProject,
  deleteProject,
};

export default projectRouter;
