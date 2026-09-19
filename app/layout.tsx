import type { Metadata } from "next";
import "./globals.css";
import {Header,Footer} from "@/components/site-shell";
export const metadata:Metadata={title:{default:"TRAMA · Tu siguiente paso en investigación",template:"%s · TRAMA"},description:"Oportunidades académicas, programas de investigación y financiación en Europa. Ciencia de datos, machine learning, estadística, informática y matemáticas aplicadas.",icons:{icon:"/favicon.svg",shortcut:"/favicon.svg"}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="es"><body><Header/>{children}<Footer/></body></html>;}
