/**
 * Public surface của module conversations.
 * Re-export từ `service.ts`.
 */

export {
  ConversationError,
  assignAdmin,
  closeConversation,
  getConversation,
  getUnreadMessageCount,
  listAdminConversations,
  listUserConversations,
  markConversationRead,
  sendMessage,
  startConversation,
  type ConversationStatus,
  type ConversationWithMessages,
  type ListAdminConversationsOptions,
  type ListUserConversationsOptions,
  type Paginated,
} from "./service";
