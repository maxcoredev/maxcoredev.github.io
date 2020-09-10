let user, products;

const populate = () => {

    user = new Model('user', {

            name: 'string',
            balance: 'number',

        }, {
            changeBalance(amount) {
                this.balance += amount
            }
        }
    );

    products = new List('product', {

            id: 'number',
            name: 'string',
            os: 'string',
            price: 'number',

        }, {
            setPrice(form, e, os, price) {
                form.price.value='';
                e.preventDefault();
                products.select({os: os}).update({price: price});
            }
        }
    );

    /*
    user.balance = 0
    products.get(3).price=30
    products.select({price:10}).update({price:15})
    */

};
