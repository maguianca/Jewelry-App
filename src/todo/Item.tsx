import React, { memo } from 'react';
import { IonItem, IonLabel,IonDatetime} from '@ionic/react';
import { ItemProps } from './ItemProps';


interface ItemPropsExt extends ItemProps {
    onEdit: (id?: string) => void;
}

const Item: React.FC<ItemPropsExt> = ({ _id,cod,categorie, pret,pietre,data, onEdit }) => {
    return (
        <IonItem onClick={() => onEdit(_id)} style={{
            minHeight: '150px',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        }}>
            <IonLabel>{cod}</IonLabel>
            <IonLabel>{categorie}</IonLabel>
            <IonLabel>{pret}</IonLabel>
            <IonLabel>{pietre ? '✔' : '❌'}</IonLabel>
            <IonLabel>{data ? new Date(data).toLocaleString() : ''}</IonLabel>
        </IonItem>
    );
};

export default memo(Item);
