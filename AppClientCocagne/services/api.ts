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

export const getBasketDetails = async (adherentId: string) => {
  try {
    const history = await getDeliveryHistory(adherentId);
    if (!history || history.length === 0) {
      return null; // Pas d'historique, donc pas de "dernier panier"
    }
    // On suppose que la dernière livraison est la plus récente
    const lastDelivery = history.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    
    // Récupérer les détails du produit pour la dernière livraison
    const productDetails = await getProductDetails(lastDelivery.produit_id);

    // Nouvelle logique pour récupérer la composition réelle
    const compoResponse = await fetch(`${API_URL}/composition_produit_legume?produit_id=eq.${lastDelivery.produit_id}`);
    if (!compoResponse.ok) throw new Error("Impossible de récupérer la composition");
    const compositionRelations = await compoResponse.json();

    const compositionNames = await Promise.all(
      compositionRelations.map(async (compo: any) => {
        const legumeResponse = await fetch(`${API_URL}/legume?id=eq.${compo.legume_id}`);
        if (!legumeResponse.ok) return 'Inconnu';
        const legumeData = await legumeResponse.json();
        return legumeData.length > 0 ? legumeData[0].nom : 'Inconnu';
      })
    );

    return {
      ...lastDelivery,
      productName: productDetails.produit,
      composition: compositionNames, // Remplacer par la composition réelle
    };

  } catch (error) {
    console.error('Error getting basket details:', error);
    throw error;
  }
};
