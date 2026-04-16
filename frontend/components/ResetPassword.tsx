"use client"
import { useState } from "react";
import { MdOutlineLockReset } from "react-icons/md";
import { Button } from "./ui/button";
import { useRouter, useSearchParams,  } from "next/navigation";
import { useToast} from "./ui/use-toast";
import { Toaster } from "./ui/toaster";
export default function ResetPassword() {
    
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email");
    
    
    const {toast} = useToast();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    async function resetPasswordHandler() {

        if(password !== confirmPassword) {

            toast({
                title: "Error",
                description: "Passwords do not match"
            })
        }
        else
        {
    
            try {
                const input = {
                    email: email,
                    password: password
                }

                const ENDPOINT = process.env.NEXT_PUBLIC_ENDPOINT;
                const response = await fetch(`${ENDPOINT}/auth/reset_password`, {
                    method: 'POST',
                    body: JSON.stringify(input),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();

                if(data?.detail === "Success") {
                    toast({
                        title: "Password Reset",
                        description: "Your password has been reset successfully"
                    })
                    router.push("/signin");
                }
                else {
                    toast({
                        title: "Error Occurred",
                        description: data?.detail
                    })
                }
            }
            catch(e) {
                console.error("Error occurred while resetting password:", e);
                toast({
                    title: "Error Occurred",
                    description: "An error occurred while resetting password"
                })
            }
        }


    }



    return (
        <div className="w-full h-screen flex flex-col justify-center items-center bg-white"> 
            <div className="w-[90%] md:w-[60%] h-[60%] bg-[var(--p-bg)] rounded-lg shadow-lg flex flex-col justify-center items-center">
                <div className="w-full flex justify-start items-center">
                    <MdOutlineLockReset className="w-6 h-6 text-[var(--sec-bg)] ml-3 mb-2 mr-3"/>
                    <h1 className="mb-2 text-2xl text-[var(--sec-bg)]">Reset Password</h1>
                </div>
                <p className="text-[var(--p-text)] my-2">Enter your new password:</p>
                <input type="password" placeholder="New Password" className="w-5/6 md:w-4/6 p-2 my-2 border-2 border-gray-500 rounded-md" onChange={e => setPassword(e.target.value)} />
                <p className="text-[var(--p-text)] my-2">Confirm your new password:</p>
                <input type="password" placeholder="Confirm Password" className="w-5/6 md:w-4/6 p-2 my-2 border-2 border-gray-500 rounded-md" onChange={e => setConfirmPassword(e.target.value)} />
                <div className="flex justify-between items-center w-5/6 md:w-4/6">
                    <Button className="w-auto bg-red-800 text-md xl:text-lg text-white p-2 mt-5" onClick={() => {
                        router.push("/signin");
                    }
                    }>Back</Button>
                    <Button className="w-auto bg-[var(--sec-bg)] text-md xl:text-lg text-white p-2 mt-5" onClick={resetPasswordHandler}>Reset Password</Button>
                </div>
            </div>
            <Toaster/>
        </div>
    )
};
