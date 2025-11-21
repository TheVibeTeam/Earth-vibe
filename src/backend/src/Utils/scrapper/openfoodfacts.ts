import axios, { AxiosInstance } from "axios";

interface ProductResult {
    status: boolean;
    data?: any;
    error?: any;
}

interface SearchResult {
    status: boolean;
    data?: any;
    count?: number;
    page?: number;
    page_size?: number;
    error?: any;
}

export default new class OpenFoodFacts {
    private client: AxiosInstance;
    private baseUrl: string;

    constructor() {
        this.baseUrl = "https://world.openfoodfacts.org";
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                "User-Agent": "NXR-SERVER/1.0 (https://github.com/al-e-devil)",
                "Accept": "application/json"
            }
        });
    }

    /**
     * Helper privado para evitar valores vacíos, undefined o "unknown"
     */
    private getValue(value: any): any {
        if (value === undefined || value === null || value === '' || value === 'unknown') {
            return null;
        }
        return value;
    }

    /**
     * Obtiene un producto por código de barras
     * @param barcode - Código de barras del producto (EAN)
     */
    async barcode(barcode: string): Promise<ProductResult> {
        if (!barcode) {
            return { status: false, error: "Barcode is required" };
        }

        try {
            const { data } = await this.client.get(`/api/v0/product/${barcode}.json`);

            if (data.status === 0) {
                return { 
                    status: false, 
                    error: "Product not found" 
                };
            }

            const product = data.product;
            const nutriments = product.nutriments || {};
            
            const thumbnail = product.image_url || 
                            product.image_front_url || 
                            product.image_front_small_url || 
                            product.image_small_url || 
                            null;

            return {
                status: true,
                data: {
                    barcode: this.getValue(product.code),
                    name: this.getValue(product.product_name),
                    brand: this.getValue(product.brands),
                    country: this.getValue(product.countries),
                    quantity: this.getValue(product.quantity),
                    ingredients: this.getValue(product.ingredients_text),
                    packaging: this.getValue(product.packaging),
                    labels: this.getValue(product.labels),
                    thumbnail: thumbnail,
                    nutriScore: this.getValue(product.nutriscore_grade),
                    novaGroup: this.getValue(product.nova_group),
                    nutrition: {
                        calories: this.getValue(nutriments['energy-kcal_100g']),
                        fat: this.getValue(nutriments.fat_100g),
                        carbs: this.getValue(nutriments.carbohydrates_100g),
                        sugars: this.getValue(nutriments.sugars_100g),
                        protein: this.getValue(nutriments.proteins_100g),
                        salt: this.getValue(nutriments.salt_100g),
                    }
                }
            };
        } catch (error) {
            return { 
                status: false, 
                error: error instanceof Error ? error.message : "Unknown error" 
            };
        }
    }

    /**
     * Busca productos por nombre o término
     * @param searchTerm - Término de búsqueda
     * @param page - Número de página (default: 1)
     * @param pageSize - Tamaño de página (default: 20)
     */
    async search(
        searchTerm: string, 
        page: number = 1, 
        pageSize: number = 20
    ): Promise<SearchResult> {
        if (!searchTerm) {
            return { status: false, error: "Search term is required" };
        }

        try {
            const { data } = await this.client.get("/cgi/search.pl", {
                params: {
                    search_terms: searchTerm,
                    search_simple: 1,
                    action: "process",
                    json: 1,
                    page,
                    page_size: pageSize
                }
            });

            return {
                status: true,
                count: data.count,
                page: data.page,
                page_size: data.page_size,
                data: data.products.map((product: any) => ({
                    code: product.code,
                    name: product.product_name,
                    brands: product.brands,
                    image: product.image_url,
                    thumbnail: product.image_small_url,
                    nutriscore_grade: product.nutriscore_grade,
                    nutrition_grade: product.nutrition_grades,
                    categories: product.categories
                }))
            };
        } catch (error) {
            return { 
                status: false, 
                error: error instanceof Error ? error.message : "Unknown error" 
            };
        }
    }

    /**
     * Busca productos por categoría
     * @param category - Nombre de la categoría (ej: "chocolates", "yogurts")
     * @param page - Número de página
     * @param pageSize - Tamaño de página
     */
    async category(
        category: string, 
        page: number = 1, 
        pageSize: number = 20
    ): Promise<SearchResult> {
        if (!category) {
            return { status: false, error: "Category is required" };
        }

        try {
            const { data } = await this.client.get(`/category/${category}.json`, {
                params: {
                    page,
                    page_size: pageSize
                }
            });

            return {
                status: true,
                count: data.count,
                page: data.page,
                page_size: data.page_size,
                data: data.products.map((product: any) => ({
                    code: product.code,
                    name: product.product_name,
                    brands: product.brands,
                    image: product.image_url,
                    thumbnail: product.image_small_url,
                    nutriscore_grade: product.nutriscore_grade,
                    categories: product.categories
                }))
            };
        } catch (error) {
            return { 
                status: false, 
                error: error instanceof Error ? error.message : "Unknown error" 
            };
        }
    }

    /**
     * Busca productos por etiqueta (label)
     * @param label - Etiqueta (ej: "vegan", "gluten-free", "organic")
     * @param page - Número de página
     * @param pageSize - Tamaño de página
     */
    async label(
        label: string, 
        page: number = 1, 
        pageSize: number = 20
    ): Promise<SearchResult> {
        if (!label) {
            return { status: false, error: "Label is required" };
        }

        try {
            const { data } = await this.client.get(`/label/${label}.json`, {
                params: {
                    page,
                    page_size: pageSize
                }
            });

            return {
                status: true,
                count: data.count,
                page: data.page,
                page_size: data.page_size,
                data: data.products.map((product: any) => ({
                    code: product.code,
                    name: product.product_name,
                    brands: product.brands,
                    image: product.image_url,
                    thumbnail: product.image_small_url,
                    nutriscore_grade: product.nutriscore_grade,
                    labels: product.labels
                }))
            };
        } catch (error) {
            return { 
                status: false, 
                error: error instanceof Error ? error.message : "Unknown error" 
            };
        }
    }

    /**
     * Busca productos por país
     * @param country - País (ej: "peru", "spain", "france")
     * @param page - Número de página
     * @param pageSize - Tamaño de página
     */
    async country(
        country: string, 
        page: number = 1, 
        pageSize: number = 20
    ): Promise<SearchResult> {
        if (!country) {
            return { status: false, error: "Country is required" };
        }

        try {
            const { data } = await this.client.get(`/country/${country}.json`, {
                params: {
                    page,
                    page_size: pageSize
                }
            });

            return {
                status: true,
                count: data.count,
                page: data.page,
                page_size: data.page_size,
                data: data.products.map((product: any) => ({
                    code: product.code,
                    name: product.product_name,
                    brands: product.brands,
                    image: product.image_url,
                    thumbnail: product.image_small_url,
                    nutriscore_grade: product.nutriscore_grade,
                    countries: product.countries
                }))
            };
        } catch (error) {
            return { 
                status: false, 
                error: error instanceof Error ? error.message : "Unknown error" 
            };
        }
    }

    /**
     * Búsqueda combinada: marca + categoría
     * @param brand - Marca (ej: "gloria", "nestle")
     * @param category - Categoría (ej: "yogurts", "chocolates")
     * @param page - Número de página
     * @param pageSize - Tamaño de página
     */
    async brand(
        brand: string,
        category: string,
        page: number = 1,
        pageSize: number = 20
    ): Promise<SearchResult> {
        if (!brand || !category) {
            return { status: false, error: "Brand and category are required" };
        }

        try {
            const { data } = await this.client.get(`/brand/${brand}/category/${category}.json`, {
                params: {
                    page,
                    page_size: pageSize
                }
            });

            return {
                status: true,
                count: data.count,
                page: data.page,
                page_size: data.page_size,
                data: data.products.map((product: any) => ({
                    code: product.code,
                    name: product.product_name,
                    brands: product.brands,
                    image: product.image_url,
                    thumbnail: product.image_small_url,
                    nutriscore_grade: product.nutriscore_grade,
                    categories: product.categories
                }))
            };
        } catch (error) {
            return { 
                status: false, 
                error: error instanceof Error ? error.message : "Unknown error" 
            };
        }
    }

    /**
     * Búsqueda combinada: país + nutriscore
     * @param country - País (ej: "peru")
     * @param nutriscoreGrade - Grado nutriscore (ej: "a", "b", "c", "d", "e")
     * @param page - Número de página
     * @param pageSize - Tamaño de página
     */
    async nutriscore(
        country: string,
        nutriscoreGrade: string,
        page: number = 1,
        pageSize: number = 20
    ): Promise<SearchResult> {
        if (!country || !nutriscoreGrade) {
            return { status: false, error: "Country and nutriscore grade are required" };
        }

        try {
            const { data } = await this.client.get(`/country/${country}/nutriscore_grade/${nutriscoreGrade}.json`, {
                params: {
                    page,
                    page_size: pageSize
                }
            });

            return {
                status: true,
                count: data.count,
                page: data.page,
                page_size: data.page_size,
                data: data.products.map((product: any) => ({
                    code: product.code,
                    name: product.product_name,
                    brands: product.brands,
                    image: product.image_url,
                    thumbnail: product.image_small_url,
                    nutriscore_grade: product.nutriscore_grade,
                    countries: product.countries
                }))
            };
        } catch (error) {
            return { 
                status: false, 
                error: error instanceof Error ? error.message : "Unknown error" 
            };
        }
    }
}
