import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  IonCheckbox,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonLoading,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import type {
  InputCustomEvent,
  InputChangeEventDetail,
} from '@ionic/react';
import { getLogger } from '../core';
import { ItemContext } from './ItemProvider';
import { RouteComponentProps } from 'react-router';
import { ItemProps } from './ItemProps';

const log = getLogger('ItemEdit');

interface ItemEditProps extends RouteComponentProps<{ id?: string }> {}

const ItemEdit: React.FC<ItemEditProps> = ({ history, match }) => {
  const { items, updating, updateError, updateItem } = useContext(ItemContext);

  const [cod, setCod] = useState('');
  const [categorie, setCategorie] = useState('');
  const [pretStr, setPretStr] = useState(''); // ✅ preț ca string
  const [pietre, setPietre] = useState(false);
  const [data, setDate] = useState(new Date());
  const [item, setItem] = useState<ItemProps>();

  useEffect(() => {
    log('useEffect');
    const routeId = match.params.id || '';
    const found = items?.find(it => it._id?.toString() === routeId);
    setItem(found);
    if (found) {
      setCod(found.cod ?? '');
      setCategorie(found.categorie ?? '');
      setPretStr(found.pret != null ? String(found.pret) : ''); // ✅ inițializare string
      setPietre(!!found.pietre);
      setDate(new Date());
    }
  }, [match.params.id, items]);

  const handleUpdate = useCallback(() => {
    const normalized = (pretStr ?? '').replace(',', '.').trim();
    const pretNumber = normalized === '' ? undefined : parseFloat(normalized);

    if (pretNumber == null || Number.isNaN(pretNumber)) {
      alert('Te rog introdu un preț valid.');
      return;
    }

    const editedItem = item
        ? { ...item, cod, categorie, pret: pretNumber, pietre, data }
        : { cod, categorie, pret: pretNumber, pietre, data };

    updateItem && updateItem(editedItem).then(() => history.goBack());
  }, [item, updateItem, cod, categorie, pretStr, pietre, data, history]);

  const handleCancel = useCallback(() => {
    history.goBack();
  }, [history]);

  log('render');
  return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle style={{ textAlign: 'center' }}>Edit Page</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          <IonInput
              placeholder="cod"
              value={cod}
              onIonChange={(e: InputCustomEvent<InputChangeEventDetail>) =>
                  setCod(e.detail.value ?? '')
              }
          />
          <IonInput
              placeholder="categorie"
              value={categorie}
              onIonChange={(e: InputCustomEvent<InputChangeEventDetail>) =>
                  setCategorie(e.detail.value ?? '')
              }
          />
          <IonInput
              type="text"
              inputmode="decimal"
              placeholder="pret"
              value={pretStr}
              onIonInput={(e: InputCustomEvent<InputChangeEventDetail>) =>
                  setPretStr(e.detail.value ?? '')
              }
          />

          <IonCheckbox
              checked={pietre}
              onIonChange={e => setPietre(e.detail.checked)}
          >
            Pietre
          </IonCheckbox>

          <IonLoading isOpen={updating} />
          {updateError && <div>{updateError.message || 'Failed to save item'}</div>}

          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={handleCancel}>Cancel</IonButton>
            </IonButtons>
            <IonButtons slot="end">
              <IonButton onClick={handleUpdate}>Update</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonContent>
      </IonPage>
  );
};

export default ItemEdit;
