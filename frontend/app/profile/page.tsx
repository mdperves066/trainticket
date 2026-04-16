"use client"

import Footer from "@/components/Footer";
import NavBar from "@/components/NavBar";
import Profile from "@/components/Profile";


export default function page()
{
    return (
        <div className="sticky min-h-screen flex flex-col">
            <NavBar signin={false}/>
            <Profile/>
            <Footer/>
        </div>
    )
}