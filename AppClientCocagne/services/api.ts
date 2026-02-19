const API_URL = 'https://api.neotech.fr';

export const login = async (email: string) => {
  try {
    // On cherche un adhérent qui correspond à l'email
    const response = await fetch(`${API_URL}/adherent?email=eq.${email}`);
    if (!response.ok) {
      throw new Error('Erreur réseau ou API');
    }
    const data = await response.json();
    
    // PostgREST retourne un tableau. S'il est vide, aucun utilisateur ne correspond.
    if (data.length === 0) {
      throw new Error('Identifiants invalides');
    }
    
    // On retourne le premier utilisateur trouvé
    return data[0];
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
};

export const getDeliveryHistory = async (adherentId: string) => {
  try {
    // 1. Trouver l'abonnement de l'adhérent
    const aboResponse = await fetch(`${API_URL}/abonnement?adherent_id=eq.${adherentId}`);
    if (!aboResponse.ok) throw new Error("Impossible de trouver l'abonnement");
    const abonnements = await aboResponse.json();
    if (abonnements.length === 0) {
      console.log("Aucun abonnement trouvé pour cet adhérent.");
      return []; // Pas d'abonnement, donc pas d'historique
    }
    const abonnement = abonnements[0]; // On prend le premier abonnement trouvé

    // 2. Trouver les livraisons liées à cet abonnement
    const livraisonResponse = await fetch(`${API_URL}/livraison?abonnement_id=eq.${abonnement.id}`);
    if (!livraisonResponse.ok) throw new Error('Impossible de récupérer les livraisons');
    const livraisons = await livraisonResponse.json();

    // 3. Enrichir chaque livraison avec le nom du produit
    const historyWithProductNames = await Promise.all(
      livraisons.map(async (livraison: any) => {
        const productDetails = await getProductDetails(livraison.produit_id);
        return {
          ...livraison,
          productName: productDetails.produit,
        };
      })
    );

    return historyWithProductNames;

  } catch (error) {
    console.error('Error fetching delivery history:', error);
    throw error;
  }
};

export const getProductDetails = async (productId: string) => {
  try {
    const response = await fetch(`${API_URL}/produit?id=eq.${productId}`);
    if (!response.ok) {
      throw new Error('Impossible de récupérer les détails du produit');
    }
    const data = await response.json();
    if (data.length === 0) {
      throw new Error('Produit non trouvé');
    }
    return data[0];
  } catch (error) {
    console.error('Error fetching product details:', error);
    throw error;
  }
};

export const getDashboardStats = async (adherentId: string) => {
  try {
    const history = await getDeliveryHistory(adherentId);
    if (!history || history.length === 0) {
      return {
        totalDeliveries: 0,
        lastProductName: null,
        lastDeliveryDate: null,
      };
    }
    
    // On trie pour trouver la livraison la plus récente
    const lastDelivery = history.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    return {
      totalDeliveries: history.length,
      lastProductName: lastDelivery.productName,
      lastDeliveryDate: lastDelivery.created_at, // On ajoute la date
    };

  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    throw error;
  }
};
