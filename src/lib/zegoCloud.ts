import { ZIM } from 'zego-zim-web';

let zimInstance: any = null;

export const initZegoCloud = async (userId: string, userName: string) => {
  const appID = parseInt(import.meta.env.VITE_ZEGOCLOUD_APP_ID || '0');
  
  if (!appID) {
    throw new Error('ZEGOCLOUD_APP_ID not configured');
  }

  // Create ZIM instance if not exists
  if (!zimInstance) {
    zimInstance = ZIM.create(appID);
  }

  // Generate token from backend
  const { data: tokenData, error } = await fetch('/api/zego-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, userName })
  }).then(r => r.json());

  if (error) throw new Error(error);

  // Login to ZIM
  const userInfo = { userID: userId, userName };
  await zimInstance.login(userInfo, tokenData.token);

  return zimInstance;
};

export const sendMessage = async (toUserId: string, message: string, type: 'peer' | 'group' = 'peer') => {
  if (!zimInstance) throw new Error('ZIM not initialized');

  const messageObj = { type: 1, message }; // type 1 = text message
  
  if (type === 'peer') {
    return await zimInstance.sendPeerMessage(messageObj, toUserId, {});
  } else {
    return await zimInstance.sendGroupMessage(messageObj, toUserId, {});
  }
};

export const getZimInstance = () => zimInstance;

export const logoutZego = async () => {
  if (zimInstance) {
    await zimInstance.logout();
    zimInstance = null;
  }
};
