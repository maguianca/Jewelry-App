import React, { useContext, useEffect, useMemo, useState } from 'react';
import { RouteComponentProps } from 'react-router';
import {
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonList,
  IonLoading,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonButtons,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonSearchbar,
  IonSelect,
  IonSelectOption
} from '@ionic/react';
import {NetworkState} from "../pages/NetworkState";
import { add } from 'ionicons/icons';
import Item from './Item';
import { getLogger } from '../core';
import { ItemContext } from './ItemProvider';
import { AuthContext } from '../auth';

const log = getLogger('ItemList');

const itemsPerPage = 5;

const ItemList: React.FC<RouteComponentProps> = ({ history }) => {
  const { logout } = useContext(AuthContext);
  const { items, fetching, fetchingError } = useContext(ItemContext);

  // UI state
  const [isOpen, setIsOpen] = useState(false);

  // search + filtre
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [stonesFilter, setStonesFilter] = useState<'da' | 'nu' | 'indiferent'| undefined>('indiferent');

  // pagination
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState<typeof items>([]);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    setIsOpen(!!fetching);
  }, [fetching]);

  log('render');

  function handleLogout() {
    logout?.();
    history.push('/login');
  }

  // categorii distincte (pt. filtru)
  const categories = useMemo(() => {
    if (!items) return [];
    const set = new Set<string>();
    items.forEach(i => i.categorie && set.add(i.categorie));
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    if (!items) return [];
    return items.filter(it => {
      const codStr = String(it.cod ?? '');
      const catStr = String(it.categorie ?? '');

      const matchesSearch =
          !searchText ||
          codStr.toLowerCase().includes(searchText.toLowerCase()) ||
          catStr.toLowerCase().includes(searchText.toLowerCase());

      const matchesCategory =
          !categoryFilter || categoryFilter === 'toate' || it.categorie === categoryFilter;

      const boolPietre =
          typeof it.pietre === 'boolean'
              ? it.pietre
              : String(it.pietre ?? '').trim().toLowerCase() === 'true';

      const matchesStones =
          stonesFilter === 'indiferent' ||
          !stonesFilter ||
          (stonesFilter === 'da' && boolPietre) ||
          (stonesFilter === 'nu' && !boolPietre);

      return matchesSearch && matchesCategory && matchesStones;
    });
  }, [items, searchText, categoryFilter, stonesFilter]);



  useEffect(() => {
    setIndex(0);
    if (!filtered) {
      setDisplayed([]);
      setHasMore(false);
      return;
    }
    setDisplayed([]);
    setTimeout(() => {
      const firstChunk = filtered.slice(0, itemsPerPage);
      setDisplayed(firstChunk);
      setIndex(firstChunk.length);
      setHasMore(firstChunk.length < filtered.length);
    }, 1000);
  }, [filtered]);


  function loadMoreWithDelay(ev: CustomEvent<void>) {
    setTimeout(() => {
      const nextIndex = Math.min(index + itemsPerPage, filtered.length);
      const nextSlice = filtered.slice(0, nextIndex);
      setDisplayed(nextSlice);
      setIndex(nextIndex);
      setHasMore(nextIndex < filtered.length);

      (ev.target as HTMLIonInfiniteScrollElement).complete();
    }, 1000);
  }



  return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Jewelry Store</IonTitle>

            <IonSelect
                slot="end"
                value={categoryFilter}
                placeholder="Categorie"
                onIonChange={(e) => setCategoryFilter(e.detail.value)}
                interface="popover"
            >
              <IonSelectOption value="toate">Toate</IonSelectOption>
              {categories.map((cat) => (
                  <IonSelectOption key={cat} value={cat}>
                    {cat}
                  </IonSelectOption>
              ))}
            </IonSelect>

            <IonSelect
                slot="end"
                value={stonesFilter}
                placeholder="Cu pietre?"
                onIonChange={(e) => setStonesFilter(e.detail.value)}
                interface="popover"
            >
              <IonSelectOption value="indiferent">Alege</IonSelectOption>
              <IonSelectOption value="da">Da</IonSelectOption>
              <IonSelectOption value="nu">Nu</IonSelectOption>
            </IonSelect>
            <NetworkState/>
            <IonSearchbar
                slot="secondary"
                placeholder="Caută după cod sau categorie"
                value={searchText}
                debounce={250}
                onIonInput={(e) => setSearchText(e.detail.value!)}
            />

            <IonButtons slot="end">
              <IonButton onClick={handleLogout}>Logout</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          <IonLoading isOpen={isOpen} message="Fetching items" />

          {displayed && (
              <IonList>
                {displayed.map(({ _id, cod, categorie, pret, pietre, data,webViewPath }) => (
                    <Item
                        key={_id}
                        _id={_id}
                        cod={cod}
                        categorie={categorie}
                        pret={pret}
                        pietre={pietre}
                        data={data}
                        webViewPath={webViewPath}
                        onEdit={(id) => history.push(`/item/${id}`)}
                    />
                ))}
              </IonList>
          )}

          <IonInfiniteScroll
              threshold="200px"
              disabled={!hasMore}
              onIonInfinite={(e: CustomEvent<void>) => loadMoreWithDelay(e)}
          >
            <IonInfiniteScrollContent loadingText="Se încarcă mai multe..."/>
          </IonInfiniteScroll>

          {fetchingError && (
              <div>{fetchingError.message || 'Failed to fetch items'}</div>
          )}

          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton onClick={() => history.push('/item')}>
              <IonIcon icon={add} />
            </IonFabButton>
          </IonFab>
        </IonContent>
      </IonPage>
  );
};

export default ItemList;
