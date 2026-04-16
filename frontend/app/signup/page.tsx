"use client"
import NavBar from "@/components/NavBar"
import SignUp from "@/components/SignUp"
export default function page()
{
    return(
        <div className="sticky min-h-screen flex flex-col">
            <NavBar signin={false}/>
            <SignUp/>
        </div>
    )
}