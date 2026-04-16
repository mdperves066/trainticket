"use client"

import Footer from "@/components/Footer";
import NavBar from "@/components/NavBar";
import TrainDetails from "@/components/TrainDetails";


export default function page() {

    return(
        <div className="sticky min-h-screen flex flex-col">
             <NavBar signin={false} div={"trainDetails"}/>
             <TrainDetails/>
             <Footer/>
        </div>
    )
    
};
