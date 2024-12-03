import { Task, TaskStatus } from '../types/task';
import { useTaskStore } from '../store/taskStore';

interface TelegramUser {
  id: string;
  username?: string;
  first_name: string;
}

interface TelegramUpdate {
  message?: {
    from: TelegramUser;
    text?: string;
    message_id: number;
    chat: {
      id: string;
    };
  };
  callback_query?: {
    id: string;
    from: TelegramUser;
    data: string;
    message?: {
      message_id: number;
      chat: {
        id: string;
      };
    };
  };
}

interface TelegramResponse<T> {
  ok: boolean;
  result: T;
  description?: string;
  error_code?: number;
}

interface InlineKeyboardButton {
  text: string;
  callback_data: string;
}

const handleTelegramError = (error: any): never => {
  if (error instanceof Response) {
    throw new Error(`Telegram API error: ${error.status} ${error.statusText}`);
  }
  if (error?.response?.data?.description) {
    throw new Error(`Telegram API error: ${error.response.data.description}`);
  }
  if (error instanceof Error) {
    throw error;
  }
  throw new Error('Unknown Telegram API error');
};

const makeRequest = async <T>(
  botToken: string,
  method: string,
  params: Record<string, any> = {}
): Promise<T> => {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw response;
    }

    const data: TelegramResponse<T> = await response.json();
    
    if (!data.ok) {
      throw new Error(data.description || 'Unknown Telegram API error');
    }

    return data.result;
  } catch (error) {
    throw handleTelegramError(error);
  }
};

const createTaskMessage = (task: {
  id: string;
  title: string;
  description?: string;
  dueDate: Date;
  importance: 'urgent' | 'normal';
  status: TaskStatus;
}): string => {
  const urgentPrefix = task.importance === 'urgent' ? '🔥 URGENT: ' : '';
  const statusEmoji = task.status === 'Done' ? '✅ ' : '';
  return `${urgentPrefix}${statusEmoji}*${task.title}*\n\n` +
    `${task.description ? `${task.description}\n\n` : ''}` +
    `📅 Due: ${new Date(task.dueDate).toLocaleDateString()}\n` +
    `🔄 Status: ${task.status}`;
};

const createTaskKeyboard = (taskId: string, status: TaskStatus) => ({
  inline_keyboard: status === 'Done' ? [] : [
    [
      { text: '✅ Complete', callback_data: `complete:${taskId}` },
      { text: '⏰ Delay 1 Day', callback_data: `delay:${taskId}:1` }
    ]
  ]
});

const clearChat = async (botToken: string, chatId: string): Promise<void> => {
  try {
    const updates = await makeRequest<TelegramUpdate[]>(botToken, 'getUpdates', {
      offset: -1,
      limit: 100,
      allowed_updates: ['message', 'callback_query']
    });

    // Delete all messages
    const deletePromises = updates
      .filter(update => {
        const messageId = update.message?.message_id || update.callback_query?.message?.message_id;
        const updateChatId = update.message?.chat.id || update.callback_query?.message?.chat.id;
        return messageId && updateChatId === chatId;
      })
      .map(update => {
        const messageId = update.message?.message_id || update.callback_query?.message?.message_id;
        return makeRequest(botToken, 'deleteMessage', {
          chat_id: chatId,
          message_id: messageId
        }).catch(() => {});
      });

    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Failed to clear chat:', error);
  }
};

export const sendTaskNotification = async (
  botToken: string,
  userId: string,
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    dueDate: Date;
    importance: 'urgent' | 'normal';
    status: TaskStatus;
  }>
): Promise<boolean> => {
  if (!botToken) throw new Error('Bot token is required');
  if (!userId) throw new Error('User ID is required');
  if (!tasks.length) throw new Error('Tasks array is required');

  try {
    // Clear chat history before sending new messages
    await clearChat(botToken, userId);

    // Send header message
    await makeRequest(botToken, 'sendMessage', {
      chat_id: userId,
      text: '🌿 *Garden Tasks Update*\n\nHere are your pending tasks:',
      parse_mode: 'Markdown'
    });

    // Send each task as a separate message with action buttons
    for (const task of tasks) {
      await makeRequest(botToken, 'sendMessage', {
        chat_id: userId,
        text: createTaskMessage(task),
        parse_mode: 'Markdown',
        reply_markup: createTaskKeyboard(task.id, task.status)
      });
    }

    return true;
  } catch (error) {
    console.error('Telegram notification error:', error);
    return false;
  }
};

export const handleCallbackQuery = async (
  botToken: string,
  queryId: string,
  messageId: number,
  chatId: string,
  action: string,
  taskId: string,
  days?: number
): Promise<void> => {
  const { updateTaskStatus, delayTask, tasks } = useTaskStore.getState();
  const task = tasks.find(t => t.id === taskId);
  
  if (!task) {
    throw new Error('Task not found');
  }

  try {
    // First, acknowledge the callback query
    await makeRequest(botToken, 'answerCallbackQuery', {
      callback_query_id: queryId,
      text: 'Processing your request...'
    });

    // Update task based on action
    if (action === 'complete') {
      await updateTaskStatus(taskId, 'Done');
    } else if (action === 'delay' && days) {
      await delayTask(taskId, days);
    }

    // Get updated task
    const updatedTask = tasks.find(t => t.id === taskId);
    if (!updatedTask) return;

    // Update the message with new status and keyboard
    await makeRequest(botToken, 'editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text: createTaskMessage(updatedTask),
      parse_mode: 'Markdown',
      reply_markup: createTaskKeyboard(taskId, updatedTask.status)
    });
  } catch (error) {
    console.error('Failed to handle callback query:', error);
    throw error;
  }
};

export const getBotUsername = async (botToken: string): Promise<string | null> => {
  if (!botToken) {
    return null;
  }

  try {
    const result = await makeRequest<{ username?: string }>(botToken, 'getMe');
    return result.username || null;
  } catch (error) {
    console.error('Failed to get bot username:', error);
    return null;
  }
};

export const getUpdates = async (botToken: string): Promise<TelegramUser[]> => {
  if (!botToken) {
    throw new Error('Bot token is required');
  }

  try {
    const updates = await makeRequest<TelegramUpdate[]>(botToken, 'getUpdates', {
      timeout: 0,
      allowed_updates: ['message', 'callback_query'],
    });

    // Process callback queries
    for (const update of updates) {
      if (update.callback_query) {
        const { id, data, message, from } = update.callback_query;
        if (!message) continue;

        const [action, taskId, daysStr] = data.split(':');
        const days = daysStr ? parseInt(daysStr, 10) : undefined;

        await handleCallbackQuery(
          botToken,
          id,
          message.message_id,
          message.chat.id,
          action,
          taskId,
          days
        );
      }
    }

    const users = new Map<string, TelegramUser>();

    updates.forEach(update => {
      if (update.message?.from) {
        const user = update.message.from;
        users.set(user.id, user);
      }
      if (update.callback_query?.from) {
        const user = update.callback_query.from;
        users.set(user.id, user);
      }
    });

    return Array.from(users.values());
  } catch (error) {
    console.error('Failed to get updates:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to get updates: ${error.message}`);
    }
    throw new Error('Failed to get updates: Unknown error');
  }
};