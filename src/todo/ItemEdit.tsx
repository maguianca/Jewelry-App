import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  IonButton, IonButtons, IonContent, IonHeader, IonInput, IonLoading, IonPage,
  IonTitle, IonToolbar, IonBackButton, IonLabel, IonDatetime, IonSelect,
  IonSelectOption, IonCheckbox, IonFab, IonFabButton,
  IonIcon, IonGrid, IonRow, IonCol, IonImg, IonActionSheet, IonItem,
  createAnimation,
  IonModal,
} from '@ionic/react';
import type {
  InputCustomEvent,
  InputChangeEventDetail,
} from '@ionic/react';
import { getLogger } from '../core';
import { ItemContext } from './ItemProvider';
import { RouteComponentProps } from 'react-router';
import { ItemProps } from './ItemProps';
import {Photo, usePhotos} from "../pages/usePhotos";
import {camera, trash} from "ionicons/icons";
const log = getLogger('ItemEdit');

interface ItemEditProps extends RouteComponentProps<{ id?: string }> {}

const ItemEdit: React.FC<ItemEditProps> = ({ history, match }) => {
  const { items, updating, updateError, updateItem } = useContext(ItemContext);

  const [cod, setCod] = useState('');
  const [categorie, setCategorie] = useState('');
  const [pretStr, setPretStr] = useState('');
  const [pietre, setPietre] = useState(false);
  const [data, setDate] = useState(new Date());
  const [item, setItem] = useState<ItemProps>();
  const {photos, takePhoto, deletePhoto} = usePhotos();
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);
  const [showStoredPictures, setShowStoredPictures] = useState<boolean>(false);
  const [webViewPath, setWebViewPath] = useState('');
  const [photoToDelete, setPhotoToDelete] = useState<Photo>();
  const photoStyle = { width: '30%', margin: "0 0 0 35%" };

  const useFadeInAnimation = (imgId: string) => {
    useEffect(() => {
      const el = document.getElementById(imgId);
      if (!el) return;
      const animation = createAnimation()
          .addElement(el)
          .duration(1200)
          .fromTo('opacity', '0', '1')
          .fromTo('transform', 'scale(0.3)', 'scale(1)');
      animation.play();
    }, [imgId, webViewPath]);
  };



  useEffect(() => {
    log('useEffect');
    const routeId = match.params.id || '';
    const found = items?.find(it => it._id?.toString() === routeId);
    setItem(found);
    if (found) {
      setCod(found.cod ?? '');
      setCategorie(found.categorie ?? '');
      setPretStr(found.pret != null ? String(found.pret) : '');
      setPietre(!!found.pietre);
      setDate(new Date());
      setWebViewPath(found.webViewPath || "");
    }
  }, [match.params.id, items]);

  useFadeInAnimation('previewImg');

  const handleUpdate = useCallback(() => {
    const normalized = (pretStr ?? '').replace(',', '.').trim();
    const pretNumber = normalized === '' ? undefined : parseFloat(normalized);

    if (pretNumber == null || Number.isNaN(pretNumber)) {
      alert('Te rog introdu un preț valid.');
      return;
    }

    const editedItem = item
        ? { ...item, cod, categorie, pret: pretNumber, pietre, data, webViewPath}
        : { cod, categorie, pret: pretNumber, pietre, data , webViewPath};

    updateItem && updateItem(editedItem).then(() => history.goBack());
  }, [item, updateItem, cod, categorie, pretStr, pietre, data, history,webViewPath]);


  async function handlePhotoChange() {
    const image = await takePhoto();
    if (!image) {
      setWebViewPath('');
    } else {
      setWebViewPath(image);
    }
  }

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
          <IonActionSheet
              isOpen={showPhotoSheet}
              onDidDismiss={() => setShowPhotoSheet(false)}
              buttons={[
                {
                  text: 'Schimbă poza',
                  handler: async () => {
                    const webPath = await takePhoto();
                    setWebViewPath(webPath ?? '');
                    setShowPhotoSheet(false);
                  },
                },
                {
                  text: 'Șterge',
                  role: 'destructive',
                  handler: () => {
                    setWebViewPath('');
                    setShowPhotoSheet(false);
                  },
                },
                { text: 'Anulează', role: 'cancel' },
              ]}
          />
          {showStoredPictures &&
              <div>
                <IonGrid>
                  <IonRow>
                    {photos.map((photo, index) => (
                        <IonCol size="6" key={index}>
                          <IonImg onClick={() => setPhotoToDelete(photo)}
                                  src={photo.webviewPath}/>
                        </IonCol>
                    ))}
                  </IonRow>
                </IonGrid>

              </div>}

          {webViewPath && (<img id="previewImg" style={photoStyle} onClick={() => setShowPhotoSheet(true)} src={webViewPath} width={'200px'} height={'200px'}/>)}
          {!webViewPath && (
              <IonFab vertical="bottom" horizontal="center" slot="fixed">
                <IonFabButton onClick={handlePhotoChange}>
                  <IonIcon icon={camera}/>
                </IonFabButton>
              </IonFab>)}

          <br/>
          <br/>
          <br/>
        </IonContent>
      </IonPage>
  );
};

export default ItemEdit;
