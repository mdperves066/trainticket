"use client"
import Footer from "@/components/Footer";
import Landing from "@/components/Landing";
import NavBar from "@/components/NavBar";
export default function Home() {
    return (
        <div className="sticky flex flex-col">
            <NavBar signin={true}/>
            <Landing />
            <Footer />
        </div>
    );
}