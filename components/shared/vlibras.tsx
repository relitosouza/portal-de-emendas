"use client";

import { useEffect } from "react";

export default function VLibras() {
    useEffect(() => {
        let script = document.getElementById("vlibras-script") as HTMLScriptElement;
        if (!script) {
            script = document.createElement("script");
            script.src = "https://vlibras.gov.br/app/vlibras-plugin.js";
            script.id = "vlibras-script";
            script.async = true;
            script.onload = () => {
            // @ts-expect-error external widget injected on the client
            if (window.VLibras) {
                    // @ts-expect-error external widget injected on the client
                    new window.VLibras.Widget("https://vlibras.gov.br/app");
                }
            };
            document.body.appendChild(script);
        }
    }, []);

    return (
        // @ts-expect-error custom VLibras attributes
        <div id="vlibras-widget" vw="true" className="enabled print:hidden">
            {/* @ts-expect-error custom VLibras attributes */}
            <div vw-access-button="true" className="active"></div>
            {/* @ts-expect-error custom VLibras attributes */}
            <div vw-plugin-wrapper="true">
                <div className="vw-plugin-top-wrapper"></div>
            </div>
        </div>
    );
}
