### Dynamic routing in Next.JS with S3, Cloudfront and Route53 via AWS Lambda

![](https://cdn-images-1.medium.com/max/800/1*VNxrrotC9xkQmcd1sx2HGA.png)

So you've got your fancy new Next.JS application and you want to deploy it? You could go for the Serverless route and utilize AWS compute power or you may not want the hassle of setting up nextjs-serverless-component and want to just export as a static site? If this is the case then AWS S3, Cloudfront and Route 53 are your answers. However, they don't come without their gotchas.

Next.JS allows you to export your application as static HTML along with it's CSS and JS files by performing the following command:

next export

> This will create a new static output of your application in the 'out' directory.

This article assumes you already know how to/have uploaded your statically generated files into S3 and setup Cloudfront and Route 53.

### Routing

One of the main challenges with using a statically generated Next.JS app is that your internal Next.JS routing won't work when navigating to specific routes, this is because you're navigating to specific files within the S3 bucket rather than a logical route within your JavaScript code.

Given the following example, you have a route at /blog, but when you navigate to this route you're shown this error. 

![](https://cdn-images-1.medium.com/max/800/1*PLLZm59ZNM20MuyiRbiOVw.png)

Cloudfront Access Denied Error --- AWS

This is because this file doesn't exist in S3. When you export your files it exports them as separate files for each route, so you'll get an index.html, blog.html and so on.

To handle these routes and navigate the user to blog.html when they attempt to go to /blog, you must route them towards it. In a typical HTTP file server, you could just add in a .htaccess file and perform a rewrite, but we can't do that with S3.

### The Solution

By creating a small serverless function in between our Cloudfront instance and S3, we can route the incoming requests to the correct underlying HTML file that we have stored in S3.

#### Fixed path routing

This is for basic /blog/posts routing to the /blog/posts.html file. See the below code for the Serverless function that will be executed in AWS Lambda.
```
const hasExtension = /(.+)\.[a-zA-Z0-9]{2,5}$/;\
const hasSlash = /\/$/;

export async function handler(event, _, callback) {
  const { request } = event.Records[0].cf;
  const uri = request.uri;

  if (uri && !uri.match(hasExtension) && !url.match(hasSlash)) {\
      request.uri = `${uri}.html`;\
  }

  return callback(null, request)
};
```

In short, this takes the API Gateway Lambda Proxy Event and uses callback function to return the new URL in the request. As this is essentially proxying the request, the user won't notice any changes and their original requested URL in the browser remains unchanged.

1.  It checks if there is a URI
2.  It then checks if the URI has an extension already
3.  If then checks if the URI has a slash at the end of it
4.  If the above checks result in false, it'll append .html onto the URI.

#### Dynamic routing

If you require the Lambda to rewrite the URL to a dynamic Next.JS route such as /blog/post/[id] (blog/post/1). You can do this by adding to the existing Lambda above to handle these use cases.
```
...

export async function handler(event, _, callback) {
	const { request } = event.Records[0].cf;
	const uri = request.uri;
	const isBlogPost = uri.indexOf("/blog/post/");

	if (uri && !uri.test(hasSlash) && !uri.test(hasExtension) && isBlogPost) {\
	    request.uri = `/blog/post/[slug].html`;\
	}
...
```

The above example, shows how to proxy requests to the [slug].html file for the route blog/[slug] where slug is a name of an article, such as <https://example.com/blog/the-best-article-ever-written,> this would translate to a proxied request to [https://example.com/blog/](https://example.com/blog/the-best-article-ever-written,)[slug].html. Where your dynamically routed Next.JS page would be able to handle it's logic to fetch the requested blog post using the slug.

There are some obvious limitations with this. These are that you won't be able to handle numerous types of dynamic route naming's without modifying and extending this logic to the point of questioning whether this is the right approach for your system. Using this Lambda as a proxy for dynamic routing **should be thought about carefully.** The ideal systems for this would be small, fairly static content website like a personal blog.