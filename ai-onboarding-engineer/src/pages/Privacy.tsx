/*
BILLION: Standard legible privacy policy.
DIRECTION: Text-heavy
SIGNATURE: Legal
*/

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background py-24 px-6 md:px-12 max-w-4xl mx-auto">
       <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
       <div className="prose prose-invert prose-sm text-muted-foreground space-y-6">
          <p>Last updated: January 1, 2026</p>
          <p>This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Service and tells You about Your privacy rights and how the law protects You.</p>
          
          <h2 className="text-xl font-semibold text-foreground">Interpretation and Definitions</h2>
          <p>The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.</p>
          
          <h2 className="text-xl font-semibold text-foreground">Collecting and Using Your Personal Data</h2>
          <p>While using Our Service, We may ask You to provide Us with certain personally identifiable information that can be used to contact or identify You.</p>

          <h3 className="text-lg font-medium text-foreground">GitHub Data</h3>
          <p>Our service explicitly requires access to your GitHub repositories to perform its core function: the generating of onboarding documents. We do not store your code permanently. We generate vector embeddings which are stored securely and used solely for the purpose of answering your queries.</p>
       </div>
    </div>
  )
}
