import React, { useRef, useEffect, useState } from "react";
import { GoogleMap } from "@capacitor/google-maps";
import { IonButton } from "@ionic/react";
import { mapsApiKey } from "./apikey";

interface MyMapProps {
    lat?: number;
    lng?: number;
    onCoordsChanged: (lat: number, lng: number) => void;
    readOnly?: boolean; // 🔒 pentru mod vizualizare
}

export const MyMap: React.FC<MyMapProps> = ({
                                                lat = 0,
                                                lng = 0,
                                                onCoordsChanged,
                                                readOnly = false,
                                            }) => {
    const mapRef = useRef<HTMLElement>(null);
    const mapInstance = useRef<GoogleMap | null>(null);
    const markerIdRef = useRef<string | null>(null);
    const [mapLoaded, setMapLoaded] = useState(false);

    const createMap = async () => {
        if (!mapRef.current || mapInstance.current) return;

        const newMap = await GoogleMap.create({
            id: "my-map",
            element: mapRef.current,
            apiKey: mapsApiKey,
            config: {
                center: { lat, lng },
                zoom: 8,
            },
        });

        mapInstance.current = newMap;
        setMapLoaded(true);
        markerIdRef.current = await newMap.addMarker({
            coordinate: { lat, lng },
        });

        if (!readOnly) {
            newMap.setOnMapClickListener(async (event) => {
                const { latitude, longitude } = event;

                try {
                    if (markerIdRef.current) {
                        await newMap.removeMarker(markerIdRef.current);
                    }
                    markerIdRef.current = await newMap.addMarker({
                        coordinate: { lat: latitude, lng: longitude },
                    });

                    onCoordsChanged(latitude, longitude);
                } catch (err) {
                    console.warn("Eroare la mutarea markerului:", err);
                }
            });
        }
    };

    useEffect(() => {
        (async () => {
            if (!mapInstance.current || !mapLoaded) return;

            const map = mapInstance.current;

            await map.setCamera({
                coordinate: { lat, lng },
                zoom: 8,
            });

            try {
                if (markerIdRef.current) {
                    await map.removeMarker(markerIdRef.current);
                }
                markerIdRef.current = await map.addMarker({
                    coordinate: { lat, lng },
                });
            } catch (e) {
                console.warn("Marker update error:", e);
            }
        })();
    }, [lat, lng, mapLoaded]);

    return (
        <div className="component-wrapper">
            <IonButton style={{ padding: 3 }} onClick={createMap}>
                View Map
            </IonButton>
            <capacitor-google-map
                ref={mapRef}
                style={{ display: "inline-block", width: "100%", height: 400 }}
            ></capacitor-google-map>
        </div>
    );
};
