/*
	ISC License

	Copyright (c) 2019, Pierre-Louis Despaigne

	Permission to use, copy, modify, and/or distribute this software for any
	purpose with or without fee is hereby granted, provided that the above
	copyright notice and this permission notice appear in all copies.

	THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
	WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
	MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
	ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
	WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
	ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
	OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
*/

const CID = require('cids')
const multiC = require('multicodec')
const multiH = require('multihashes')
const package = require('./package.json')

/**
 * Convert an hexadecimal string to a Buffer, the string can start with or without '0x'
 * @param {string} hex an hexadecimal value
 * @return {Buffer} the resulting Buffer
 */
function hexString(hex) {
	let prefix = hex.slice(0, 2)
	let value = hex.slice(2)
	let res = ''
	if (prefix === '0x') res = value
	else res = hex
	return multiH.fromHexString(res)
}

module.exports = {
	version: package.version,

	/**
	* Decode a Content Hash.
	* @param {string} hash an hex string containing a content hash
	* @return {string} the decoded content
	*/
	decode: function (hash) {

		let buffer = hexString(hash)
		
		const codec = multiC.getCodec(buffer)	// get the codec
		let value = multiC.rmPrefix(buffer)		// get the remaining value
		let cid = new CID(value)				// prepare a cid from value in case the codec is of type ipfs or swarm

		let res = value.toString('hex')

		if (codec === 'swarm-ns'){
			value = cid.multihash
			res = multiH.decode(value).digest.toString('hex')
		} else if (codec === 'ipfs-ns'){
			value = cid.multihash	
			res = multiH.toB58String(value)
		} else { // if codec is not of type ipfs/swarm just return the remaining value
			console.warn('⚠️ WARNING ⚠️ : unknown codec ' + codec.toString('hex') + ' for content-hash ' + res)
		}
		return res
	},

	/**
	* Encode an IPFS address into a content hash
	* @param {string} ipfsHash string containing an IPFS address
	* @return {string} the resulting content hash
	*/
	fromIpfs: function (ipfsHash) {
		let multihash = multiH.fromB58String(ipfsHash)	// get Multihash buffer
		let res = new CID(1, 'dag-pb', multihash)		// create a CIDv1 with the multihash
		res = multiC.addPrefix('ipfs-ns', res.buffer)	// add ipfs codec prefix
		return res.toString('hex')
	},

	/**
	* Encode a Swarm address into a content hash
	* @param {string} swarmHash string containing a Swarm address
	* @return {string} the resulting content hash
	*/
	fromSwarm: function (swarmHash) {
		swarmHash = hexString(swarmHash)
		let multihash = multiH.encode(swarmHash, 'keccak-256')	// get Multihash buffer
		let res = new CID(1, 'dag-pb', multihash)				// create a CIDv1 with the multihash
		res = multiC.addPrefix('swarm-ns', res.buffer)			// add swarm codec prefix
		return res.toString('hex')
	},

	/**
	* Extract the codec of a content hash
	* @param {string} hash hex string containing a content hash
	* @return {string} the extracted codec
	*/
	getCodec: function (hash) {
		let buffer = hexString(hash)
		return multiC.getCodec(buffer)
	},
}