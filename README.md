sudo docker run -d -p 6379:6379 --add-host=host.docker.internal:host-gateway --restart=unless-stopped --name redis redis

use host.docker.internal as in place of localhost - redis.

## Shiprocket Checkout Invariants
- Variants must be synced before checkout
- Unsynced variants cannot enter Shiprocket checkout
- Cart validation is enforced server-side
