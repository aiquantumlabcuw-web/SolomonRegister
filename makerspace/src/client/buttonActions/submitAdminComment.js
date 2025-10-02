import GlobalConfig from '../../../config/GlobalConfig';

export async function submitComment(data) {
  try {
    const response = await fetch(`${GlobalConfig.nodeUrl}/ticket/submitComment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
      },
      body: data,
    });
    // Return the raw response for your front-end to handle
    return response;
  } catch (error) {
    throw error;
  }
}
