import Image from "next/image";


export default function MissionPage() {
    return (
        <div>
            <main className="p-6">
                <h1 className="text-2xl font-bold mb-4">🌍 Наша місія</h1>
                <p className="text-lg">
                    Ми будуємо Дім Світла, Любові і Добра.
                    Це простір для єдності, миру та нової свідомості людства.
                </p>
                <div style={{ width: '100%', height: '500px', position: 'relative', overflow: 'hidden', marginTop: '6rem' }}>
                          <Image
                            src="/og-image.jpg"
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
