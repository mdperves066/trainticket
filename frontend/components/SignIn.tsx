"use client"
import { useState } from "react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast" 
import { Toaster } from "./ui/toaster";

export default function SignIn() {

    const router = useRouter();

    const {toast} = useToast();

    const ENDPOINT = process.env.NEXT_PUBLIC_ENDPOINT;

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    async function signinHandler()
    {
        const input ={
            email: email,
            password: password
        }
        const response = await fetch(`${ENDPOINT}/auth/signin`, {
            method: 'POST',
            body: JSON.stringify(input),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();

        console.log(data);
        
        if (data?.id)
        {
            localStorage.setItem("token","Bearer"+" "+data.access_token);
            localStorage.setItem("id",data.id);
            localStorage.setItem("name",data.name);
            localStorage.setItem("email",data.email);
            router.push("/");
        }
        else
        {
            toast({
                title: "You Cannot Be Logged In!",
                description : data?.detail ?? "Some Error Occured",
            })
        }
    }

    return (
        <div className="bg-[var(--p-bg)] w-full h-[80%] flex justify-center items-center">
            <div className="bg-[var(--p-bg)] w-[80%] md:w-[60%] h-screen flex flex-col justify-center items-center p-4">
                <p className="text-xl lg:text-3xl font-bold text-[var(--sec-bg)]">Log into your account</p>
                <input type="email" placeholder="Email" className="w-full md:w-4/6 p-2 my-4 border-2 border-gray-500 rounded-md" onChange={e =>setEmail(e.target.value)}/>
                <input type="password" placeholder="Password" className="w-full md:w-4/6 p-2 my-4 border-2 border-gray-500 rounded-md" onChange={e =>setPassword(e.target.value)}/>
                <div className="flex justify-between items-center w-full md:w-4/6">
                    <Button className="w-auto bg-[var(--sec-bg)] text-lg xl:text-xl text-white mb-10" onClick={signinHandler}>Sign In</Button>
                    <Button className="w-auto bg-red-800 text-sm xl:text-lg text-white p-4 mb-10" onClick={()=>
                        {
                            router.push("/forget_password")
                        }
                    }>Forget Password?</Button>
                </div>
                <div className="md:hidden flex flex-col justify-center items-center ">
                    <p className="text-xs md:text-sm text-[var(--sec-bg)] text-nowrap my-3">Don't have an account?</p>
                    <Button className="w-auto bg-blue-800 text-lg md:text-2xl text-white p-4"
                    onClick={()=>{
                        router.push("/signup")
                    }}>Sign Up</Button>
                </div>
            </div>
            <div className="w-[40%] h-screen bg-[var(--sec-bg)] hidden md:flex flex-col justify-center items-center p-2">
                <h1 className="text-md md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl  text-nowrap font-bold text-white mb-10 xl:my-2">New to BD Railway Online Booking?</h1>
                <p className=" hidden xl:block xl:text-xl tracking-tighter text-nowrap text-white mb-4">Sign up now to book tickets and enjoy a hassle-free journey.</p>
                <Button className="w-auto bg-blue-800 text-lg md:text-2xl text-white p-4" onClick={()=>{
                    router.push("/signup")
                }}>Sign Up</Button>
            </div>
            <Toaster/>
        </div>
    )
}