import { observable, action, computed, runInAction, reaction, decorate } from 'mobx';
import agent from '../api/agent';

const LIMIT = 4;

class ProductStore {
    rootStore;
    constructor(rootStore) {
        this.rootStore = rootStore;

        reaction(
            () => this.predicate.keys(),
            () => {
                this.page = 0;
                this.productRegistry.clear();
                this.loadProducts();
            },
        );
    }

    productRegistry = new Map();
    product = null;
    loadingInitial = false;
    submitting = false;
    target = '';
    loading = false;
    productCount = 0;
    page = 0;
    predicate = new Map();

    setPredicate = (predicate, value) => {
        this.predicate.clear();
        if (predicate !== 'all') {
            this.predicate.set(predicate, value);
        }
    };

    get axiosParams() {
        const params = new URLSearchParams();
        params.append('limit', String(LIMIT));
        params.append('page', `${this.page ? this.page * LIMIT : 0}`);
        this.predicate.forEach((value, key) => {
            params.append(key, value);
        });
        return params;
    }

    get totalPages() {
        return Math.ceil(this.productCount / LIMIT);
    }

    get products() {
        return Array.from(this.productRegistry.values());
    }

    setPage = (page: number) => {
        this.page = page;
    };

    loadProducts = async () => {
        this.loadingInitial = true;
        try {
            const productsEnvelope = await agent.Products.list(this.axiosParams);
            const { data, count } = productsEnvelope;
            runInAction('loading activities', () => {
                data.forEach((product) => {
                    this.productRegistry.set(product._id, product);
                });
                this.productCount = count;
                this.loadingInitial = false;
            });
        } catch (error) {
            runInAction('load activities error', () => {
                this.loadingInitial = false;
            });
        }
    };
}

decorate(ProductStore, {
    productRegistry: observable,
    product: observable,
    loadingInitial: observable,
    submitting: observable,
    target: observable,
    loading: observable,
    productCount: observable,
    page: observable,
    predicate: observable,

    axiosParams: computed,
    totalPages: computed,

    setPredicate: action,
    setPage: action,
    loadProducts: action,
});

export default ProductStore;