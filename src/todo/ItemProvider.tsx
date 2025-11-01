import React, { useCallback, useEffect, useReducer, useContext } from 'react';
import PropTypes from 'prop-types';
import { getLogger } from '../core';
import { ItemProps } from './ItemProps';
import { createItem, getItems, newWebSocket, updateItem } from './itemApi';
import { AuthContext } from '../auth';
import { useNetwork } from '../pages/useNetwork';
import { useIonToast } from "@ionic/react";
import { Preferences } from '@capacitor/preferences';

const log = getLogger('ItemProvider');

type UpdateItemFn = (item: ItemProps) => Promise<any>;

interface ItemsState {
  items?: ItemProps[];
  fetching: boolean;
  fetchingError?: Error | null;
  updating: boolean;
  updateError?: Error | null;
  updateItem?: UpdateItemFn;
  saveItem?: UpdateItemFn;
  successMessage?: string;
  closeShowSuccess?: () => void;
}

interface ActionProps {
  type: string;
  payload?: any;
}

const initialState: ItemsState = {
  fetching: false,
  updating: false,
};

const FETCH_ITEMS_STARTED = 'FETCH_ITEMS_STARTED';
const FETCH_ITEMS_SUCCEEDED = 'FETCH_ITEMS_SUCCEEDED';
const FETCH_ITEMS_FAILED = 'FETCH_ITEMS_FAILED';
const UPDATE_ITEM_STARTED = 'UPDATE_ITEM_STARTED';
const UPDATE_ITEM_SUCCEEDED = 'UPDATE_ITEM_SUCCEEDED';
const UPDATE_ITEM_FAILED = 'UPDATE_ITEM_FAILED';
const CREATE_ITEM_STARTED = 'CREATE_ITEM_STARTED';
const CREATE_ITEM_SUCCEEDED = 'CREATE_ITEM_SUCCEEDED';
const CREATE_ITEM_FAILED = 'CREATE_ITEM_FAILED';
const SHOW_SUCCESS_MESSAGE = 'SHOW_SUCCESS_MESSAGE';
const HIDE_SUCCESS_MESSAGE = 'HIDE_SUCCESS_MESSAGE';

const reducer : (state: ItemsState, action: ActionProps)=> ItemsState = (state, {type,payload})=> {
  switch(type) {
    case FETCH_ITEMS_STARTED:
      return { ...state, fetching: true, fetchingError: null };
    case FETCH_ITEMS_SUCCEEDED:
      return { ...state, items: payload.items, fetching: false };
    case FETCH_ITEMS_FAILED:
      return { ...state, fetchingError: payload.error, fetching: false };
    case UPDATE_ITEM_STARTED:
      return { ...state, updateError: null, updating: true };
    case CREATE_ITEM_STARTED:
      return { ...state, updateError: null, updating: true };
    case UPDATE_ITEM_SUCCEEDED:
      const items = [...(state.items || [])];
      const item = payload.item;
      const index = items.findIndex(it => it._id === item._id);
      items[index] = item;
      return { ...state,  items, updating: false };
    case CREATE_ITEM_SUCCEEDED:
      const beforeItems = [...(state.items || [])];
      const createdItem = payload.item;
      console.log(createdItem);
      const indexOfAdded = beforeItems.findIndex(it => it._id === createdItem._id );
      console.log("index: ", indexOfAdded);
      if (indexOfAdded === -1) {
        beforeItems.splice(0, 0, createdItem);
      } else {
        beforeItems[indexOfAdded] = createdItem;
      }
      console.log(beforeItems);
      console.log(payload);
      return { ...state,  items: beforeItems, updating: false, updateError: null };
    case UPDATE_ITEM_FAILED:
      return { ...state, updateError: payload.error, updating: false };
    case CREATE_ITEM_FAILED:
      console.log(payload.error);
      return { ...state, updateError: payload.error, updating: false };
    case SHOW_SUCCESS_MESSAGE:
      return { ...state, successMessage: payload.successMessage };
    case HIDE_SUCCESS_MESSAGE:
      return { ...state, successMessage: undefined };
    default:
      return state;
  }
};

export const ItemContext = React.createContext<ItemsState>(initialState);

interface ItemProviderProps {
  children: PropTypes.ReactNodeLike;
}

export const ItemProvider: React.FC<ItemProviderProps> = ({ children }) => {
  const { token } = useContext(AuthContext);
  const [state, dispatch] = useReducer(reducer, initialState);
  const { items, fetching, fetchingError, updating, updateError, successMessage } = state;
  const { networkStatus } = useNetwork();
  const [toast] = useIonToast();

  useEffect(getItemsEffect, [token]);
  useEffect(wsEffect, [token]);
  useEffect(executePendingOperations, [networkStatus.connected, token, toast]);

  const saveItem = useCallback<UpdateItemFn>(saveItemCallback, [token]);
  const updateItemFn = useCallback<UpdateItemFn>(updateItemCallback, [token]);

  const value = { items, fetching, fetchingError, updating, updateError, saveItem, updateItem: updateItemFn, successMessage, closeShowSuccess };

  return (
      <ItemContext.Provider value={value}>
        {children}
      </ItemContext.Provider>
  );

  function getItemsEffect() {
    let canceled = false;

    async function fetchItems() {
      if(!token?.trim()) return;
      try {
        log('fetchItems started');
        dispatch({ type: FETCH_ITEMS_STARTED });
        const items = await getItems(token);
        if (!canceled) dispatch({ type: FETCH_ITEMS_SUCCEEDED, payload: { items } });
      } catch (error) {
        if (!canceled) dispatch({ type: FETCH_ITEMS_FAILED, payload: { error } });
      }
    }

    fetchItems();
    return () => { canceled = true; };
  }

  async function saveItemCallback(item: ItemProps) {
    try {
      log('saveItem start')
      dispatch({ type: CREATE_ITEM_STARTED });
      const savedItem = await (item._id ? updateItem(token, item) : createItem(token, item));
      dispatch({ type: CREATE_ITEM_SUCCEEDED, payload: { item: savedItem } });
      log('saveItem successfully')
    } catch (error: any) {
      console.log('Error saving item:', error);

      // doar daca suntem offline
      if (!networkStatus.connected || (error.isAxiosError && error.message === 'Network Error')) {
        console.log('Saving offline');
        item.isNotSaved = true;
        const { keys } = await Preferences.keys();
        const numberOfItems = keys.filter(key => key.startsWith('sav-')).length + 1;
        item._id = numberOfItems.toString();
        await Preferences.set({ key: `sav-${item._id}`, value: JSON.stringify({ token, item }) });
        dispatch({ type: CREATE_ITEM_SUCCEEDED, payload: { item:item } });
        toast("You are offline... Saving item locally!", 3000);
      } else {
        dispatch({ type: CREATE_ITEM_FAILED, payload: { error:new Error('Network Error') } });
      }
    }
  }


  async function updateItemCallback(item: ItemProps) {
    try {
      log('updateItem start')
      dispatch({ type: UPDATE_ITEM_STARTED });
      const updatedItem = await updateItem(token, item);
      dispatch({ type: UPDATE_ITEM_SUCCEEDED, payload: { item: updatedItem } });
      log('updateItem successfully')
    } catch (error: any) {
      if (!networkStatus.connected || (error.isAxiosError && error.message === 'Network Error')) {
        console.log('Updating offline');
        item.isNotSaved = true;
        await Preferences.set({ key: `upd-${item._id}`, value: JSON.stringify({ token, item }) });
        dispatch({ type: UPDATE_ITEM_SUCCEEDED, payload: { item: item } });
        toast("You are offline... Updating item locally!", 3000);
      } else {
        dispatch({ type: UPDATE_ITEM_FAILED, payload: { error: new Error('Network Error') } });
      }
    }
  }


  function executePendingOperations(){
    async function helperMethod(){
      if(networkStatus.connected && token?.trim()){
        log('executing pending operations')
        const { keys } = await Preferences.keys();
        for(const key of keys) {
          toast("You are online again... Saving items!", 3000);
          if(key.startsWith("sav-")){
            const res = await Preferences.get({key: key});
            console.log("Result", res);
            if (typeof res.value === "string") {
              const value = JSON.parse(res.value);
              value.item._id=undefined;
              log('creating item from pending', value);
              await saveItemCallback(value.item);
              await Preferences.remove({key: key});
            }
          }
          if(key.startsWith("upd-")){
            const res = await Preferences.get({key: key});
            console.log("Result", res);
            if (typeof res.value === "string") {
              const value = JSON.parse(res.value);
              log('updating item from pending', value);
              await updateItemCallback(value.item);
              await Preferences.remove({key: key});
            }
          }
        }
      }
    }
    helperMethod();
  }

  function wsEffect() {
    let canceled = false;
    let closeWebSocket: () => void;

    if (token?.trim()) {
      closeWebSocket = newWebSocket(token, message => {
        if (canceled) return;

        const { event, payload } = message;

        if (event === 'created') {
          dispatch({ type: CREATE_ITEM_SUCCEEDED, payload: { item: payload.items } });
        } else if (event === 'updated') {
          dispatch({ type: UPDATE_ITEM_SUCCEEDED, payload: { item: payload.items } });
        }
      });
    }

    return () => {
      canceled = true;
      closeWebSocket?.();
    };
  }


  function closeShowSuccess() {
    dispatch({ type: HIDE_SUCCESS_MESSAGE });
  }
};
