// src/utils/apiFetch.ts

export async function apiFetch<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const defaultOptions: RequestInit = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    credentials: 'include'
  };

  const fetchOptions: RequestInit = { ...defaultOptions, ...options };

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`Ошибка сети: ${response.statusText} (код ${response.status})`);
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    // error может быть unknown, привести к any для throw
    console.error('Ошибка при выполнении запроса:', error);
    throw error;
  }
}
