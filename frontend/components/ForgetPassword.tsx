"use client"

import { RiLockPasswordLine } from "react-icons/ri";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import EmailSend from "@/utility/EmailSend";
import { useToast } from "./ui/use-toast";
import { Toaster } from "./ui/toaster";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";

export default function ForgetPassword() {

    const router = useRouter();
    const ENDPOINT = process.env.NEXT_PUBLIC_ENDPOINT;

    const { toast } = useToast();

    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [resetCode, setResetCode] = useState("");

    const [isDialogOpen, setIsDialogOpen] = useState(false)

    async function forgetPasswordHandler() {
        const randomFiveDigitNumber = Math.floor(10000 + Math.random() * 90000);

        try {
            const input =
            {
                email: email,
                code: randomFiveDigitNumber.toString()
            }

            const response = await fetch(`${ENDPOINT}/auth/forget_password`, {
                method: 'POST',
                body: JSON.stringify(input),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json()

            if (data?.detail === "Success") {
                toast({
                    title: "Reset Code Sent",
                    description: "A reset code has been sent to your email"
                })
            }

            EmailSend(email, name, `Your Reset Code is ${randomFiveDigitNumber}`);

            setIsDialogOpen(true)

        }
        catch (e) {
            console.error("Error occurred while sending reset code:", e);
            toast({
                title: "Error Occurred",
                description: `An error occurred while sending codes. Try again later.`
            });
        }

    }

    async function confirmCodeHandler() {
        try {
            const input =
            {
                email: email,
                code: resetCode
            }

            const response = await fetch(`${ENDPOINT}/auth/confirm_code`, {
                method: 'POST',
                body: JSON.stringify(input),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json()

            if (data?.detail === "Success") {
                toast({
                    title: "Code Confirmed",
                    description: "Code has been confirmed successfully"
                })
                router.push(`/reset_password?email=${email}`);
            }
            else {
                toast({
                    title: "Code Not Confirmed",
                    description: "Code is not correct. Try again"
                })
            }

        }
        catch (e) {
            console.error("Error occurred while confirming code:", e);
            toast({
                title: "Error Occurred",
                description: `An error occurred while confirming code. Try again later.`
            });
        }
    }


    return (
        <div className="w-[90%] md:w-[60%] h-[60%] bg-[var(--p-bg)] rounded-lg shadow-lg flex flex-col items-center justify-center">
            <div className="w-full flex justify-start items-center p-4">
                <RiLockPasswordLine className="w-6 h-6 text-[var(--sec-bg)] ml-2 mb-2 mr-2" />
                <h1 className="text-[var(--sec-bg)] text-xl font-semibold ml-2 mb-2">Forget Password</h1>
            </div>
            <p className="text-slate-700 text-xs md:text-md font-semibold text-nowrap p-1 mb-4">Enter your email address & name to reset your password</p>
            <input type="email" placeholder="Email" className="w-5/6 md:w-4/6 p-2 my-3 border-2 border-gray-500 rounded-md" onChange={e => setEmail(e.target.value)} />
            <input type="text" placeholder="Name" className="w-5/6 md:w-4/6 p-2 my-3 border-2 border-gray-500 rounded-md" onChange={e => setName(e.target.value)} />
            <div className="flex justify-between items-center mt-6 w-5/6 md:w-4/6">
                <Button className="w-auto bg-red-800 text-sm xl:text-lg text-white p-4 mb-10" onClick={() => {
                    router.push("/signin");
                }
                }>Back</Button>
                <Button className="w-auto bg-[var(--sec-bg)] text-sm xl:text-lg text-white mb-10" onClick={forgetPasswordHandler}>Sent Code</Button>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                </DialogTrigger>
                <DialogContent>
                    <DialogTitle>Confirm Reset code</DialogTitle>
                    <DialogDescription>
                        Write the code that we sent you on your email.
                    </DialogDescription>
                    <div className="flex flex-col items-center justify-center">
                        <input type="text" placeholder="Reset Code" className="w-4/6 p-2 my-3 border-2 border-gray-500 rounded-md" onChange={e => setResetCode(e.target.value)} />
                        <Button className="bg-[var(--sec-bg)] text-lg xl:text-xl text-white mb-10" onClick={confirmCodeHandler}>Confirm</Button>
                    </div>

                </DialogContent>
            </Dialog>
            <Toaster />
        </div>
    )
}