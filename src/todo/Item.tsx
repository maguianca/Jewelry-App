import React, { memo } from 'react';
import { IonItem, IonLabel,IonDatetime} from '@ionic/react';
import { ItemProps } from './ItemProps';


interface ItemPropsExt extends ItemProps {
    onEdit: (id?: string) => void;
}

const Item: React.FC<ItemPropsExt> = ({ id,cod,categorie, pret,pietre,data, onEdit }) => {
    return (
        <IonItem onClick={() => onEdit(id)}>
            <IonLabel>{cod}</IonLabel>
            <IonLabel>{categorie}</IonLabel>
            <IonLabel>{pret}</IonLabel>
            <IonLabel>{pietre ? '✔' : '❌'}</IonLabel>
            <IonLabel>{data ? new Date(data).toLocaleString() : ''}</IonLabel>
        </IonItem>
    );
};

export default memo(Item);
