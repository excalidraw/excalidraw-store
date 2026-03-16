> this repo replaces a previous implementation in https://github.com/excalidraw/excalidraw-json

# Excalidraw Store

The server that stores all the encrypted sharable drawings from [Excalidraw](https://excalidraw.com) on Google Storage.

## Development

Get the [`service key`](https://cloud.google.com/iam/docs/creating-managing-service-account-keys) as JSON and store it under `keys` directory with the name of the project ID.

### Environment Variables

| Variable                   | Description                                      | Default Value                                                                   | Required |
| -------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- | -------- |
| `GOOGLE_CLOUD_PROJECT`     | Google Cloud project ID                          | `excalidraw-json-dev`                                                           | No       |
| `GOOGLE_CLOUD_BUCKET_NAME` | Google Cloud Storage bucket name                 | `excalidraw-json.appspot.com` (prod) or `excalidraw-json-dev.appspot.com` (dev) | No       |
| `NODE_ENV`                 | Environment mode                                 | -                                                                               | No       |
| `ALLOW_ORIGINS`            | Comma-separated list of allowed origins for CORS | Default allowed origins list                                                    | No       |
| `PORT`                     | Port number for the server                       | `8080`                                                                          | No       |

### Commands

```
yarn dev
yarn start
yarn build
yarn deploy
yarn deploy:dev
yarn fix
yarn test
```

## Protocol

### POST

Example endpoint URL

```
https://json.excalidraw.com/api/v2/post/
```

#### Binary payload

Example of `binary` payload

```
1234567890
```

#### Response

```
{
  "id": "5633286537740288",
  "data": "https://json.excalidraw.com/api/v2/5633286537740288"
}
```

### GET

Example endpoint URL

```
https://json.excalidraw.com/api/v2/5633286537740288
```

#### Response

Example of binary response. If the id is found it will return the data. Otherwise 404.

```
1234567890
```

## Tips

### Check how many files are on Google Storage

```
gsutil du gs://excalidraw-json.appspot.com | wc -l
```
