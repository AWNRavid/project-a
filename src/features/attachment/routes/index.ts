import { deleteAttachment } from "./delete-attachment";
import { getIssueAttachments } from "./get-issue-attachments";
import { uploadAttachment } from "./upload-attachment";

// Router keys become the client API:
// orpcClient.attachment.<name>(...)
const attachmentRouter = {
  uploadAttachment,
  getIssueAttachments,
  deleteAttachment,
};

export default attachmentRouter;
