/**
 * -----------------------------------------------------------------------------
 * Imports
 * -----------------------------------------------------------------------------
 */
import React from 'react';
import { Link } from 'react-router-dom';

/**
 * -----------------------------------------------------------------------------
 * React Component: Footer
 * -----------------------------------------------------------------------------
 */

const Footer = ({ nav = [], year }) => (
    <footer>
        <div className={'row'}>
            <div className={'col-xs-12 col-md-5'}>
                <ul>
                    <li>
                        <span>&reg; {year} Dirty Dogs all rights reserved</span>
                    </li>
                </ul>
            </div>
            <div className={'col-xs-12 col-md-7 row end-md'}>
                {nav.length < 1 ? null : (
                    <ul className={'mt-xs-5 mt-sm-5 mt-md-0'}>
                        {nav.map((item, i) => {
                            let { label, url } = item;

                            return url ? (
                                <li key={`footer-nav-${i}`}>
                                    <Link to={url}>{label}</Link>
                                </li>
                            ) : (
                                <li key={`footer-nav-${i}`}>
                                    <span>{label}</span>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    </footer>
);

Footer.defaultProps = {
    year: new Date().getFullYear(),
    nav: [
        { label: '123 Sesame Str. Columbus, Ohio 43215' },
        { label: '614.555.0422' },
        { label: 'Contact Us', url: '/demo/site/contact' },
    ],
};

export default Footer;
