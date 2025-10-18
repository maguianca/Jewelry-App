import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  IonCheckbox,
  IonDatetime,
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
import { getLogger } from '../core';
import { ItemContext } from './ItemProvider';
import { RouteComponentProps } from 'react-router';
import { ItemProps } from './ItemProps';

const log = getLogger('ItemEdit');

interface ItemEditProps extends RouteComponentProps<{
  id?: string;
}> {}

const ItemEdit: React.FC<ItemEditProps> = ({ history, match }) => {
  const { items, saving, savingError, saveItem } = useContext(ItemContext);
  const [cod, setCod] = useState('');
  const [categorie, setCategorie] = useState('');
  const [pret, setPret] = useState(0);
  const [pietre, setPietre] = useState(false);
  const [data, setDate] = useState(new Date());
  const [item, setItem] = useState<ItemProps>();
  useEffect(() => {
    log('useEffect');
    const routeId = match.params.id || '';
    const item = items?.find(it => it.id?.toString() === routeId);
    setItem(item);
    if (item) {
      setCod(item.cod);
      setCategorie(item.categorie);
      setPret(item.pret);
      setPietre(item.pietre);
      setDate(new Date());
    }
  }, [match.params.id, items]);

  const handleSave = useCallback(() => {
    const editedItem = item ? { ...item, cod, categorie, pret,pietre,data} : { cod,categorie,pret,pietre,data};
    saveItem && saveItem(editedItem).then(() => history.goBack());
  }, [item, saveItem, cod,categorie,pret,pietre, history]);

  const handleCancel = useCallback(() => {
    history.goBack();
  }, [item, history]);

  log('render');
  return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle style={{ textAlign: 'center' }}>Edit Page</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          <IonInput placeholder='cod' value={cod} onIonChange={e => setCod(e.detail.value || '')} />
          <IonInput placeholder='categorie' value={categorie} onIonChange={e => setCategorie(e.detail.value|| '')} />
          <IonInput placeholder='pret' value={pret} onIonChange={e => setPret(Number(e.detail.value)|| 0)} />
          <IonCheckbox checked={pietre} onIonChange={e => setPietre(e.detail.checked)}>Pietre</IonCheckbox>
          <IonLoading isOpen={saving} />
          {savingError && (
              <div>{savingError.message || 'Failed to save item'}</div>
          )}
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={handleCancel}>
                Cancel
              </IonButton>
            </IonButtons>
            <IonButtons slot="end">
              <IonButton onClick={handleSave}>
                Save
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonContent>
      </IonPage>
  );
};

export default ItemEdit;
