export interface ItemProps {
  _id?: string;
  cod: string;
  categorie: string;
  pret: number;
  pietre: boolean;
  data: Date;
  isNotSaved?:boolean;
  webViewPath?: string;
  latitude?:number;
  longitude?:number;
}
