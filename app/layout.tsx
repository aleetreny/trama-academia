import type { Metadata } from "next";
import "./globals.css";
import {sitePath} from "@/lib/site-path";
import {Header,Footer} from "@/components/site-shell";
export const metadata:Metadata={title:{default:"TRAMA · Tu camino al doctorado desde España",template:"%s · TRAMA"},description:"Prepara tu camino al doctorado desde España: experiencia investigadora, acceso, grupos y financiación en datos, IA, estadística, informática y matemáticas aplicadas.",icons:{icon:sitePath("/favicon.svg"),shortcut:sitePath("/favicon.svg")}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="es"><body><Header/>{children}<Footer/></body></html>;}
