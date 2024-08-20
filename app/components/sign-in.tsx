import { signIn } from "@/auth";
import { Button } from "../ui/button";
import { ArrowRightIcon } from "@heroicons/react/20/solid";

export default function SignIn() {
    return (
        <form action={async () => {
            "use server";
            await signIn("github");
        }} className=" text-white rounded-md text-center py-2">
            <Button className="mt-4 w-full bg-slate-500" >
            Sign in with GitHub <ArrowRightIcon className="ml-auto h-5 w-5 text-gray-50" />
            </Button>
            {/* <button type="submit">Sign in with GitHub</button> */}
        </form>
    )
}