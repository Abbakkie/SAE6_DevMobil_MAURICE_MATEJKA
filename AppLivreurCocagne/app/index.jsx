import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Alert,
    ActivityIndicator,
    Platform
} from 'react-native';
import { Stack } from 'expo-router';
import {
    Truck, QrCode, ArrowLeft, ChevronRight, Navigation2,
    Package, ShoppingBasket, RefreshCcw, Clock, Wifi, Battery
} from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

const API_BASE_URL = "https://api.neotech.fr";

let MapView, Marker, PROVIDER_GOOGLE;
if (Platform.OS !== 'web') {
    try {
        const Maps = require('react-native-maps');
        MapView = Maps.default;
        Marker = Maps.Marker;
        PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
    } catch (e) {
        console.warn("Maps non chargé");
    }
}

export default function App() {
    const [view, setView] = useState('list');
    const [loading, setLoading] = useState(false);
    const [tours, setTours] = useState([]);
    const [itinerary, setItinerary] = useState([]);
    const [stats, setStats] = useState({ simples: 0, familiaux: 0 });
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [scanTarget, setScanTarget] = useState('depot');
    const [basketsScanned, setBasketsScanned] = useState(0);

    // ÉTAT POUR LE DÉLAI DE SCAN
    const [isScanningPaused, setIsScanningPaused] = useState(false);

    const [permission, requestPermission] = useCameraPermissions();

    useEffect(() => {
        fetchTours();
    }, []);

    const fetchTours = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/tournee`);
            const data = await response.json();
            setTours(data);
        } catch (err) {
            setTours([{ id: 1, tournee: "Tournée Épinal", couleur: "#059669" }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectTour = async (tour) => {
        setLoading(true);
        try {
            const resDist = await fetch(`${API_BASE_URL}/distribution?tournee_id=eq.${tour.id}&order=ordre.asc`);
            const dataDist = await resDist.json();

            setItinerary(dataDist.length > 0 ? dataDist : [
                { id: 1, lieu: "Mairie de Charmes", adresse: "Place de la Mairie", qte: 5, lat: 48.3712, lng: 6.2917 },
                { id: 2, lieu: "Prairie Claudel", adresse: "Rue Claudel", qte: 3, lat: 48.2500, lng: 6.4167 }
            ]);
            setStats({ simples: 12, familiaux: 8 });
            setCurrentStepIndex(0);
            setView('summary');
        } catch (err) {
            Alert.alert("Erreur", "Problème de connexion API.");
        } finally {
            setLoading(false);
        }
    };

    const handleBarcodeScanned = ({ data }) => {
        // SI LE SCAN EST EN PAUSE, ON NE FAIT RIEN
        if (isScanningPaused) return;

        // ON ACTIVE LA PAUSE
        setIsScanningPaused(true);

        const currentStep = itinerary[currentStepIndex];
        const total = parseInt(currentStep?.qte || 1);

        if (scanTarget === 'depot') {
            Alert.alert("Lieu Validé", `Arrivé à : ${currentStep.lieu}`);
            setScanTarget('panier');
            const updateDistribution = async () => {
                try {
                    await fetch(`${API_BASE_URL}/distribution?id=eq.${currentStep.id}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Prefer': 'return=minimal' // Standard PostgREST
                        },
                        body: JSON.stringify({
                            validated_at: new Date().toISOString()
                        })
                    });
                    console.log("Statut de livraison mis à jour sur NeoTech");
                } catch (e) {
                    console.log("Erreur API Distribution :", e);
                }
            };

            updateDistribution();
        } else {
            if (basketsScanned < total - 1) {
                setBasketsScanned(prev => prev + 1);
            } else {
                if (currentStepIndex < itinerary.length - 1) {
                    Alert.alert("Succès", "Dépôt fini ! En route vers le prochain point.");
                    setCurrentStepIndex(v => v + 1);
                    setScanTarget('depot');
                    setBasketsScanned(0);
                    setView('navigation');
                } else {
                    setView('list');
                    Alert.alert("Terminé", "Bravo ! Tournée terminée.");
                }
            }
        }


        setTimeout(() => {
            setIsScanningPaused(false);
        }, 1500);
    };

    const Header = ({ title, onBack }) => (
        <View style={styles.header}>
            <View style={styles.headerContent}>
                {onBack ? (
                    <TouchableOpacity onPress={onBack} style={styles.iconBtn}><ArrowLeft size={24} color="white" /></TouchableOpacity>
                ) : <View style={{ width: 44 }} />}
                <Text style={styles.headerTitle}>{title}</Text>
                <TouchableOpacity onPress={fetchTours} style={styles.iconBtn}>
                    {loading ? <ActivityIndicator size="small" color="white" /> : <RefreshCcw size={20} color="white" />}
                </TouchableOpacity>
            </View>
        </View>
    );

    if (!permission) return <View style={styles.centered}><ActivityIndicator /></View>;

    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.statusBar}>
                <View style={styles.row}><Clock size={10} color="white" /><Text style={styles.statusText}> 12:00</Text></View>
                <View style={styles.row}><Wifi size={10} color="white" style={{ marginRight: 8 }} /><Battery size={10} color="white" /></View>
            </View>

            {view === 'list' && (
                <>
                    <Header title="Mes Tournées" />
                    <ScrollView contentContainerStyle={styles.scrollContainer}>
                        <View style={styles.heroCard}>
                            <Text style={styles.heroTitle}>Mes Circuits</Text>
                            <Text style={styles.heroSub}>{tours.length} circuits (NeoTech)</Text>
                        </View>
                        {tours.map(tour => (
                            <TouchableOpacity key={tour.id} style={styles.tourCard} onPress={() => handleSelectTour(tour)}>
                                <View style={styles.rowBetween}>
                                    <Text style={styles.tourCode}>{tour.tournee}</Text>
                                    <ChevronRight size={20} color="#d1d5db" />
                                </View>
                                <Text style={styles.tourDay}>ID Circuit : #{tour.id}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </>
            )}

            {view === 'summary' && (
                <>
                    <Header title="Inventaire" onBack={() => setView('list')} />
                    <ScrollView contentContainerStyle={styles.scrollContainer}>
                        <Text style={styles.sectionTitle}>Chargement Camion</Text>
                        <View style={styles.inventoryGrid}>
                            <View style={styles.statBox}><Package size={20} color="#059669" /><Text style={styles.statNum}>{stats.simples}</Text><Text style={styles.statLab}>Simples</Text></View>
                            <View style={styles.statBox}><ShoppingBasket size={20} color="#059669" /><Text style={styles.statNum}>{stats.familiaux}</Text><Text style={styles.statLab}>Familiaux</Text></View>
                        </View>
                        <View style={styles.itineraryCard}>
                            {itinerary.map((step, i) => (
                                <View key={i} style={styles.stepRow}>
                                    <View style={styles.stepDot}><Text style={styles.stepDotText}>{i+1}</Text></View>
                                    <View style={{flex:1}}><Text style={styles.stepLieu}>{step.lieu}</Text></View>
                                    <Text style={styles.stepQte}>x{step.qte}</Text>
                                </View>
                            ))}
                        </View>
                    </ScrollView>
                    <TouchableOpacity style={styles.btnAction} onPress={() => setView('navigation')}>
                        <Navigation2 size={20} color="white" /><Text style={styles.btnText}>DÉMARRER</Text>
                    </TouchableOpacity>
                </>
            )}

            {view === 'navigation' && (
                <>
                    <Header title="Navigation" onBack={() => setView('summary')} />
                    <View style={styles.mapContainer}>
                        {Platform.OS !== 'web' && MapView ? (
                            <MapView style={StyleSheet.absoluteFillObject} provider={PROVIDER_GOOGLE}
                                     initialRegion={{ latitude: itinerary[currentStepIndex]?.lat || 48.1724, longitude: itinerary[currentStepIndex]?.lng || 6.4491, latitudeDelta: 0.01, longitudeDelta: 0.01 }}>
                                <Marker coordinate={{ latitude: itinerary[currentStepIndex]?.lat || 48.1724, longitude: itinerary[currentStepIndex]?.lng || 6.4491 }} />
                            </MapView>
                        ) : <View style={styles.centered}><Text>Carte active sur Mobile</Text></View>}
                    </View>
                    <View style={styles.bottomSheet}>
                        <Text style={styles.sheetTitle}>{itinerary[currentStepIndex]?.lieu}</Text>
                        <TouchableOpacity style={styles.btnPrimary} onPress={async () => {
                            if (!permission.granted) await requestPermission();
                            setView('scan');
                        }}>
                            <QrCode size={20} color="white" /><Text style={styles.btnText}>ARRIVÉ AU DÉPÔT</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}

            {view === 'scan' && (
                <View style={styles.containerBlack}>
                    <CameraView
                        style={StyleSheet.absoluteFillObject}
                        onBarcodeScanned={handleBarcodeScanned}
                        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                    />
                    <View style={styles.scanOverlay}>
                        <View style={styles.scanFrame} />

                        {/* PETIT INDICATEUR VISUEL QUAND LE SCAN EST EN PAUSE */}
                        <View style={{ height: 40, justifyContent: 'center' }}>
                            {isScanningPaused && <ActivityIndicator color="#059669" />}
                        </View>

                        <Text style={styles.scanInstructions}>
                            {scanTarget === 'depot' ? "Scanner le Lieu" : `Panier ${basketsScanned + 1}/${itinerary[currentStepIndex]?.qte}`}
                        </Text>

                        <TouchableOpacity style={styles.btnBackScan} onPress={() => setView('navigation')}>
                            <Text style={{color:'white', fontWeight:'bold'}}>RETOUR</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f9fafb' },
    statusBar: { backgroundColor: '#042f24', paddingHorizontal: 16, paddingVertical: 4, flexDirection: 'row', justifyContent: 'space-between' },
    statusText: { color: 'white', fontSize: 10 },
    row: { flexDirection: 'row', alignItems: 'center' },
    header: { backgroundColor: '#065f46', paddingVertical: 15 },
    headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15 },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    iconBtn: { padding: 5 },
    scrollContainer: { padding: 20, paddingBottom: 100 },
    heroCard: { backgroundColor: '#059669', padding: 25, borderRadius: 20, marginBottom: 20 },
    heroTitle: { color: 'white', fontSize: 24, fontWeight: 'bold' },
    heroSub: { color: '#bbf7d0', fontSize: 12, marginTop: 5 },
    tourCard: { backgroundColor: 'white', padding: 20, borderRadius: 15, marginBottom: 12, elevation: 3 },
    tourCode: { fontSize: 18, fontWeight: 'bold' },
    tourDay: { color: '#6b7280', fontSize: 13, marginTop: 5 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 15 },
    inventoryGrid: { flexDirection: 'row', gap: 10, marginBottom: 25 },
    statBox: { flex: 1, backgroundColor: 'white', padding: 15, borderRadius: 15, alignItems: 'center', elevation: 2 },
    statNum: { fontSize: 22, fontWeight: 'bold' },
    statLab: { fontSize: 10, color: '#9ca3af', fontWeight: 'bold' },
    itineraryCard: { backgroundColor: 'white', borderRadius: 20, padding: 20, elevation: 2 },
    stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    stepDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#065f46', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    stepDotText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
    stepLieu: { fontSize: 15, fontWeight: '500' },
    stepQte: { fontWeight: 'bold', color: '#059669' },
    btnAction: { backgroundColor: '#065f46', margin: 20, padding: 18, borderRadius: 15, alignItems: 'center' },
    btnText: { color: 'white', fontWeight: 'bold' },
    mapContainer: { flex: 1, backgroundColor: '#e5e7eb' },
    bottomSheet: { backgroundColor: 'white', padding: 30, borderTopLeftRadius: 35, borderTopRightRadius: 35, elevation: 15 },
    sheetTitle: { fontSize: 22, fontWeight: 'bold' },
    btnPrimary: { backgroundColor: '#065f46', padding: 18, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
    containerBlack: { flex: 1, backgroundColor: 'black' },
    scanOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    scanFrame: { width: 250, height: 250, borderWidth: 2, borderColor: 'white', borderStyle: 'dashed', borderRadius: 25 },
    scanInstructions: { color: 'white', marginTop: 30, fontSize: 18, fontWeight: 'bold' },
    btnBackScan: { marginTop: 50, padding: 10 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});