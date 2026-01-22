import AsyncStorage from '@react-native-async-storage/async-storage';
import { HOST } from './constants';
export let reauthing = false;

// Callback opcional para navegação quando necessário
let navigationCallback: ((route: string) => void) | null = null;

export const setNavigationCallback = (callback: (route: string) => void) => {
  navigationCallback = callback;
};

type FailedRequest = {
  onSuccess: (newToken: string) => void;
  onFailure: (error: any) => void;
};

const requestsFailedWithInvalidToken: FailedRequest[] = [];

function callAction(path: string, options: any, onProgress = null) {
  return fetch(path, options)
    .then((response: any) => {
      if (response.status === 403) {
        response.json().then((data: any) => {
          let text = '';
          if (data.permission) {
            text = `Para melhor experiência, solicite a habilitação da permissão: \n${data.permission}.`;
          }
          if (!data.permission) {
            text = 'Você não tem permissão para essa ação.';
          }
          return response;
        });
      }

      if (response.status === 401 && typeof response.json === 'function') {
        return response.json().then(async (data: any) => {
          if (
            (data &&
              (data.error === 'Unauthorized' ||
                data.error === 'User not authenticated or not found')) ||
            (data.message === 'Invalid JWT' && !reauthing)
          ) {
            await AsyncStorage.setItem('@SkallApp:filiaId', '');
            if (navigationCallback) {
              navigationCallback('Login');
            }
          }

          return new Promise((resolve, reject) => {
            requestsFailedWithInvalidToken.push({
              onSuccess: (newToken: string) => {
                // options.headers.Authorization = newToken;

                resolve(callAction(path, options, onProgress));
              },
              onFailure: (error: any) => {
                reject(error);
              },
            });
          });
        });
      }

      let resp: Promise<any> | null = null;
      if (!(response instanceof Response)) {
        resp = new Promise((resolve) => resolve(response));
      }

      if (!response.then) {
        resp = new Promise((resolve) => resolve(response));
      }

      if (resp && resp.then && response.status === 204) {
        return resp.then(() => ({ response, body: null }));
      }

      if (typeof response.json === 'function') {
        return response.json().then((data: any) => ({ response, body: data }));
      }

      if (response && !response.ok) {
        response.ok =
          response.response.status >= 200 && response.response.status <= 204;
      }

      return resp;
    })
    .catch((e) => {
      throw new Error(e);
    });
}

async function request(
  path: string,
  method = 'GET',
  data: any = null,
  onProgress: any = null
) {
  const headers: HeadersInit = {};

  const filiaId = (await AsyncStorage.getItem('@SkallApp:filiaId')) ?? '';
  headers['X-Filial-Id'] = filiaId;

  if (data && data.toString() === '[object Object]') {
    data = JSON.stringify(data);
  }

  if (data && data.toString() !== '[object FormData]') {
    headers.Accept = 'application/json';
    headers['Content-Type'] = 'application/json';
  }

  const options: RequestInit = {
    method,
    headers,
    body: data,
  };

  return callAction(`${HOST}/${path}`, options, onProgress);
}

export const get = <T>(path: string, data?: T) => request(path, 'GET', data);
export const destroy = <T>(path: string, data: T) =>
  request(path, 'DELETE', data);
export const put = <T>(
  path: string,
  data?: T,
  onProgress?: any,
  token?: string
) => request(path, 'PUT', data, onProgress);
export const post = <T>(path: string, data: T, onProgress?: any) =>
  request(path, 'POST', data, onProgress);