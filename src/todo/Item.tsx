import React, { memo } from 'react';
import { IonItem, IonLabel,IonDatetime} from '@ionic/react';
import { ItemProps } from './ItemProps';


interface ItemPropsExt extends ItemProps {
    onEdit: (id?: string) => void;
}
const photoStyle = { width: '100%', margin: "0 0 0 0%" };
const Item: React.FC<ItemPropsExt> = ({ _id,cod,categorie, pret,pietre,data,webViewPath, onEdit }) => {
    return (
        <IonItem onClick={() => onEdit(_id)} style={{
            minHeight: '150px',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        }}>
            <IonLabel>{webViewPath && (<img style={photoStyle} src={webViewPath} width={'200px'} height={'200px'}/>)}</IonLabel>
            <IonLabel>{cod}</IonLabel>
            <IonLabel>{categorie}</IonLabel>
            <IonLabel>{pret}</IonLabel>
            <IonLabel>{pietre ? '✔' : '❌'}</IonLabel>
            <IonLabel>{data ? new Date(data).toLocaleString() : ''}</IonLabel>
        </IonItem>
    );
};

export default memo(Item);
