import Image from "next/image"; 

export default function ContactPage() {
    return (
        <div>
            <main className="p-6">
                <h1 className="text-2xl font-bold mb-4">📬 Контакти</h1>
                <p>
                    Напиши нам, і ми обов’язково відповімо 💌
                    Email: <a href="mailto:c-e21297@ukr.net" className="text-sky-400 underline">c-e21297@ukr.net</a>
                </p>
                <div style={{ width: '100%', height: '500px', position: 'relative', overflow: 'hidden', marginTop: '6rem' }}>
                          <Image
                            src="/love.png"
                            alt="Interdimensional Light House"
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            style={{ objectFit: 'contain', objectPosition: 'center'}}
                          /> 
                </div> 
            </main>
        </div>
    );
}
