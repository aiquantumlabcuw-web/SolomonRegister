export default function LabelInputBox({label,placeholder,onChange,type,labelSize}){
    return <>
        <div className=" w-72 sm:w-96 xl:w-[80%]" >
            <label className="block mb-2 text-lg sm:text-xl xl:text-4xl font-medium text-gray-900 dark:text-black">{label}</label>
            <input type={type} onChange={onChange}   id="first_name" className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-xs sm:text-sm xl:text-2xl rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5  dark:border-gray-600 dark:placeholder-gray-600 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder={placeholder} required />
        </div>
        
    </>
}