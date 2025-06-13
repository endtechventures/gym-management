# Member Import Processing Edge Function

This Edge Function processes member imports by reading CSV files from Supabase Storage and creating member records in the database.

## Deployment Instructions

### Prerequisites

1. Install the Supabase CLI:
\`\`\`bash
npm install -g supabase
\`\`\`

2. Login to Supabase:
\`\`\`bash
supabase login
\`\`\`

### Deploy the Edge Function

1. Navigate to the project root directory:
\`\`\`bash
cd your-project-directory
\`\`\`

2. Link your project (replace 'your-project-ref' with your actual Supabase project reference):
\`\`\`bash
supabase link --project-ref your-project-ref
\`\`\`

3. Deploy the Edge Function:
\`\`\`bash
supabase functions deploy process-member-import
\`\`\`

### Test the Edge Function

You can test the Edge Function using the Supabase CLI:

\`\`\`bash
supabase functions serve process-member-import
\`\`\`

Then, in another terminal, send a test request:

\`\`\`bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/process-member-import' \
  --header 'Authorization: Bearer YOUR_SUPABASE_JWT_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{"importId": "your-import-id"}'
\`\`\`

## Function Details

The Edge Function performs the following steps:

1. Fetches the import job details from the database
2. Updates the status to "processing"
3. Downloads the CSV file from Supabase Storage
4. Parses the CSV data and maps columns according to the import configuration
5. Creates member records in the database
6. Updates the import job with progress information
7. Marks the import as completed when finished

## Troubleshooting

If you encounter issues:

1. Check the Edge Function logs:
\`\`\`bash
supabase functions logs process-member-import
\`\`\`

2. Make sure the storage bucket permissions are correctly set
3. Verify that the JWT token has the necessary permissions
4. Check that the file URL in the import job is correct
