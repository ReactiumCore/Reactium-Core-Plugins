/**
 * -----------------------------------------------------------------------------
 * Imports
 * -----------------------------------------------------------------------------
 */
import React from 'react';
import Hero from 'reactium_modules/@atomic-reactor/reactium-demo/Demo/Site/Hero';
import Features from 'reactium_modules/@atomic-reactor/reactium-demo/Demo/Site/Features';
import Template from 'reactium_modules/@atomic-reactor/reactium-demo/Demo/Site/Template';

/**
 * -----------------------------------------------------------------------------
 * Home
 * -----------------------------------------------------------------------------
 */

const Home = ({ hero, features = {} }) => {
    return (
        <Template>
            <main role='main'>
                <Hero {...hero} />
                <Features {...features} />
            </main>
        </Template>
    );
};

Home.defaultProps = {
    hero: {
        icon: '/assets/images/demo-site/icon-hotdog.png',
        cta: {
            to: '/demo/site/catering',
            type: 'link',
            children: ['More Dogs ‘n Make Em Hot'],
        },
        content: [
            'Dirty Dogs serves all-beef, vegan and',
            'vegetarian hot dogs.',
        ],
    },
    features: {
        layout: ['col-xs-12 col-md-6', 'col-xs-12 col-md-6'],
        items: [
            {
                backgroundImage: 'url(/assets/images/demo-site/feature-01.png)',
                caption:
                    'Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum.',
                title: 'Gourmet All Beef Hotdogs',
            },
            {
                backgroundImage: 'url(/assets/images/demo-site/feature-02.png)',
                caption:
                    'Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum.',
                title: 'Vegan Hotdogs',
            },
            {
                backgroundImage: 'url(/assets/images/demo-site/feature-03.png)',
                caption:
                    'Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum.',
                title: 'Vegetarian Hotdogs',
            },
        ],
    },
};

export default Home;
