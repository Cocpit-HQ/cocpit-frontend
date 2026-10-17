# Channel API contract

This document outlines the API endpoints used by the `channel.service.ts` to manage Channels (referred to as "Communities" on the backend) and their content (Articles/Thoughts).

The frontend now adapts directly to the existing backend architecture, meaning we reuse the generic `/post` endpoints for articles and thoughts, and use the `/organizations/:orgId/community` endpoints for channel management.

**Note on missing features:** 
- **Article Drafts**: The backend does not support drafts. All saved articles are immediately published as active posts.
- **Subscriber Growth**: The backend does not track historical subscriber growth, so charts currently receive empty data.
- **Request Edit Access**: The backend lacks an endpoint to request contributor access to a channel.

---

## 1. Get my channel

`GET /organizations/:orgId/community/status`

**200** — Returns the organization's community status:
```json
{
  "success": true,
  "has_community": true,
  "community": {
    "community_id": "uuid",
    "org_id": "uuid",
    "name": "Nexsus Global Systems",
    "description": "Stay updated...",
    "banner_url": "https://cdn.cocpit.com/...",
    "created_at": "2026-05-01T09:00:00.000Z"
  }
}
```

---

## 2. Create channel

`POST /organizations/:orgId/community`

**Headers**: `Content-Type: multipart/form-data`
**Body**: 
- `name` (text)
- `description` (text)
- `banner` (file)

**201**
```json
{
  "success": true,
  "message": "Community created successfully",
  "data": {
    "community_id": "uuid",
    "org_id": "uuid",
    "name": "Nexsus Global Systems",
    "description": "Stay updated...",
    "banner_url": "https://..."
  }
}
```

---

## 3. Update channel

`PUT /organizations/:orgId/community`

**Headers**: `Content-Type: multipart/form-data`
**Body**: Any subset of `name`, `description`, or `banner` (file).

**200**
```json
{
  "success": true,
  "message": "Community updated successfully",
  "data": {
    "community_id": "uuid",
    "name": "Nexsus Global Systems",
    ...
  }
}
```

---

## 4. List articles

`GET /communities/:communityId/articles`

**200**
```json
{
  "success": true,
  "data": [
    {
      "post_id": "uuid",
      "title": "Beyond The Screen",
      "content": "<h1>...</h1>",
      "banner_url": "https://...",
      "created_at": "2026-05-20T10:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 10
}
```

---

## 5. Get one article

`GET /post/:id`

Returns a generic hydrated post object.
**200**
```json
{
  "post_id": "uuid",
  "author_org_id": "uuid",
  "title": "The Synthesis Layer",
  "content": "<h1>...</h1>",
  "media_urls": [
    { "url": "https://..." }
  ],
  "created_at": "2026-05-20T10:00:00.000Z",
  "updated_at": "2026-05-20T10:00:00.000Z"
}
```

---

## 6. Create article

`POST /post`

**Headers**: `Content-Type: multipart/form-data`
**Body**:
- `post_type`: `"article"`
- `author_org_id`: `uuid` (the community ID)
- `visibility`: `"public"`
- `title`: (text)
- `content`: (text/html)
- `media`: (file - optional)

**201**
```json
{
  "message": "Post created successfully",
  "postId": "uuid",
  "title": "The Synthesis Layer",
  "content": "..."
}
```

---

## 7. Update article

`PUT /post/:id`

**Body (JSON)**:
```json
{
  "title": "Updated Title",
  "content": "Updated content..."
}
```

**200**
```json
{
  "message": "Post updated",
  "data": {
    "post_id": "uuid",
    "title": "Updated Title",
    ...
  }
}
```

---

## 8. Delete article

`DELETE /post/:id`

**200**
```json
{
  "message": "Post deleted",
  "deletedPostId": "uuid"
}
```

---

## 9. List invite candidates

`GET /organizations/:orgId/community/invite-suggestions?search=`

**200**
```json
{
  "success": true,
  "data": [
    {
      "user_id": "uuid",
      "name": "James Karl",
      "avatar": "https://...",
      "headline": "Product Designer",
      "is_invited": false
    }
  ]
}
```

---

## 10. Invite people

`POST /organizations/:orgId/community/invite`

**Note**: The backend only supports inviting one user per request. The frontend currently loops over user IDs to emulate batch inviting.

**Body (JSON)**:
```json
{ "invitee_id": "uuid" }
```

**200**
```json
{
  "success": true,
  "message": "Invitation sent",
  "invite_id": "uuid"
}
```

---

## 11. List thoughts (comments) on an article

`GET /post/:id/comments`

**200**
```json
{
  "success": true,
  "data": [
    {
      "comment_id": "uuid",
      "full_name": "Jordan Alexis",
      "avatar_url": "https://...",
      "content": "Great read!",
      "created_at": "2026-07-11T09:00:00.000Z"
    }
  ]
}
```

---

## 12. Add a thought

`POST /post/:id/comments`

**Body (JSON)**:
```json
{ "content": "Great read!" }
```

**201**
```json
{
  "message": "Comment added",
  "comment": {
    "comment_id": "uuid",
    "content": "Great read!",
    "full_name": "Jordan Alexis",
    ...
  }
}
```

---

## 13. Delete a thought

`DELETE /comments/:id`

**200**
```json
{
  "message": "Comment deleted successfully"
}
```
