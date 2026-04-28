import { useEffect, useRef, useState } from 'react'
import { FaMagnifyingGlass, FaXmark } from 'react-icons/fa6'
import styles from './forum.module.css'

const DEFAULT_DEBOUNCE_MS = 500

function ForumSearchBar({
	value = '',
	onSearch,
	placeholder = '',
	debounceMs = DEFAULT_DEBOUNCE_MS,
	ariaLabel,
}) {
	const [inputValue, setInputValue] = useState(value)
	const onSearchRef = useRef(onSearch)
	const lastEmittedRef = useRef(value)

	useEffect(() => {
		onSearchRef.current = onSearch
	}, [onSearch])

	useEffect(() => {
		if (value !== inputValue && value !== lastEmittedRef.current) {
			setInputValue(value)
			lastEmittedRef.current = value
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [value])

	useEffect(() => {
		const handler = window.setTimeout(() => {
			const next = inputValue.trim()
			if (next === lastEmittedRef.current) return
			lastEmittedRef.current = next
			onSearchRef.current?.(next)
		}, debounceMs)

		return () => window.clearTimeout(handler)
	}, [inputValue, debounceMs])

	const handleClear = () => {
		setInputValue('')
		lastEmittedRef.current = ''
		onSearchRef.current?.('')
	}

	return (
		<div className={styles.searchBar}>
			<FaMagnifyingGlass className={styles.searchBarIcon} aria-hidden="true" />
			<input
				type="text"
				className={styles.searchBarInput}
				value={inputValue}
				onChange={(event) => setInputValue(event.target.value)}
				placeholder={placeholder}
				aria-label={ariaLabel || placeholder}
			/>
			{inputValue ? (
				<button
					type="button"
					className={styles.searchBarClearBtn}
					onClick={handleClear}
					aria-label={ariaLabel ? `${ariaLabel} clear` : 'Clear search'}
				>
					<FaXmark />
				</button>
			) : null}
		</div>
	)
}

export default ForumSearchBar
