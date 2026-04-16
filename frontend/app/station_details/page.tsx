"use client"
import Footer from "@/components/Footer";
import NavBar from "@/components/NavBar";
import RouteDetails from "@/components/RouteDetails";

export default function page() {

    return(
        <div className="sticky min-h-screen flex flex-col">
             <NavBar signin={false} div={"routeDetails"}/>
             <RouteDetails/>
             <Footer/>
        </div>
    )
    
};